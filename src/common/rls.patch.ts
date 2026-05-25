import { Client } from 'pg';
import { AsyncLocalStorage } from 'async_hooks';

export interface RlsContext {
  condominiumId: string | null;
  bypassRls: boolean;
}

export const rlsLocalStorage = new AsyncLocalStorage<RlsContext>();

const originalQuery = Client.prototype.query;

// Patch pg Client.prototype.query
Client.prototype.query = function (this: any, ...args: any[]) {
  // Prevent infinite recursion during session initialization
  if (this._settingSession) {
    return originalQuery.apply(this, args);
  }

  const store = rlsLocalStorage.getStore();
  const desiredCondominiumId = store ? store.condominiumId : null;
  const desiredBypassRls = store ? (store.bypassRls ? 'true' : 'false') : 'true';

  const currentCondo = this._currentCondominiumId;
  const currentBypass = this._currentBypassRls;

  // If the connection session state already matches the desired request state, execute directly
  if (currentCondo === desiredCondominiumId && currentBypass === desiredBypassRls) {
    return originalQuery.apply(this, args);
  }

  // We need to synchronize the connection's session variables
  this._settingSession = true;

  const self = this;

  // Execute parameter-based config query to avoid SQL injection
  const syncQuery = `SELECT set_config('app.current_condominium_id', $1, false), set_config('app.bypass_rls', $2, false)`;
  const syncParams = [desiredCondominiumId || '', desiredBypassRls];

  // TypeORM uses Promise-based pg client queries
  const runSyncAndOriginal = async () => {
    try {
      await originalQuery.call(self, syncQuery, syncParams);
      self._currentCondominiumId = desiredCondominiumId;
      self._currentBypassRls = desiredBypassRls;
    } finally {
      self._settingSession = false;
    }
    return originalQuery.apply(self, args);
  };

  // If the last argument is a callback function, handle it (e.g. legacy/third-party calls)
  const callback = args[args.length - 1];
  if (typeof callback === 'function') {
    originalQuery.call(self, syncQuery, syncParams, (err: any) => {
      self._settingSession = false;
      if (err) {
        return callback(err);
      }
      self._currentCondominiumId = desiredCondominiumId;
      self._currentBypassRls = desiredBypassRls;
      return originalQuery.apply(self, args);
    });
    return;
  }

  return runSyncAndOriginal();
};
