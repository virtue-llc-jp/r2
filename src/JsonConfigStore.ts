import { injectable, unmanaged } from 'inversify';
import { ConfigStore, ConfigRoot } from './types';
import { getConfigRoot, getConfigPath } from './configUtil';
import ConfigValidator from './ConfigValidator';
import { setTimeout } from 'timers';
import { configStoreSocketUrl } from './constants';
import * as _ from 'lodash';
import * as fs from 'fs';
import { promisify } from 'util';
import { getLogger } from '@bitr/logger';
import { ConfigRequest, ConfigResponse, ConfigResponder } from './messages';
import { EventEmitter } from 'events';

const writeFile = promisify(fs.writeFile);

@injectable()
export default class JsonConfigStore extends EventEmitter implements ConfigStore {
  private readonly log = getLogger(this.constructor.name);
  private timer: NodeJS.Timer;
  private readonly responder: ConfigResponder;
  TTL = 5 * 1000;
  private cache?: ConfigRoot;

  constructor(private readonly configValidator: ConfigValidator, @unmanaged() url?: string) {
    super();
    this.responder = new ConfigResponder(url ?? configStoreSocketUrl, (request, respond) =>
      this.requestHandler(request, respond)
    );
  }

  get config(): ConfigRoot {
    if (this.cache) {
      return this.cache;
    }
    const config = getConfigRoot();
    this.configValidator.validate(config);
    this.updateCache(config);
    return config;
  }

  async set(config: ConfigRoot) {
    this.configValidator.validate(config);
    await writeFile(getConfigPath(), JSON.stringify(config, undefined, 2));
    this.updateCache(config);
  }

  close() {
    this.responder.dispose();
  }

  private async requestHandler(request: ConfigRequest | undefined, respond: (response: ConfigResponse) => void) {
    if (request === undefined) {
      this.log.debug(`Invalid message received.`);
      respond({ success: false, reason: 'invalid message' });
      return;
    }
    switch (request.type) {
      case 'set':
        try {
          const newConfig = request.data;
          await this.set(_.merge({}, getConfigRoot(), newConfig));
          respond({ success: true });
          this.log.debug(`Config updated with ${JSON.stringify(newConfig)}`);
        } catch (ex) {
          respond({ success: false, reason: 'invalid config' });
          this.log.warn(`Failed to update config. Error: ${ex.message}`);
          this.log.debug(ex.stack);
        }
        break;
      case 'get':
        respond({ success: true, data: getConfigRoot() });
        break;
      default:
        this.log.warn(`ConfigStore received an invalid message. Message: ${request}`);
        respond({ success: false, reason: 'invalid message type' });
        break;
    }
  }

  private updateCache(config: ConfigRoot) {
    this.cache = config;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => (this.cache = undefined), this.TTL);
    this.emit('configUpdated', config);
  }
} /* istanbul ignore next */
