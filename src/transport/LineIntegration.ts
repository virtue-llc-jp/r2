import fetch, { RequestInit as FetchRequestInit } from 'node-fetch';
import { LineConfig } from '../types';
import * as querystring from 'querystring';

export default class LineIntegration {
  static fetchTimeout = 5000;
  static apiUrl = 'https://notify-api.line.me/api/notify';

  constructor(private readonly config: LineConfig) {
    this.config = config;
  }

  async handler(message: string): Promise<void> {
    const keywords = this.config.keywords;
    if (!(keywords instanceof Array)) {
      return;
    }
    if (!keywords.some(x => message.includes(x))) {
      return;
    }
    const payload = {
      message
    };
    const body = querystring.stringify(payload);
    const init: FetchRequestInit = {
      body,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': body.length.toString()
      },
      timeout: LineIntegration.fetchTimeout
    };
    return fetch(LineIntegration.apiUrl, init)
      .then(res => {
        if (!res.ok) {
          res.text().then(s => console.log(`LINE notify failed. ${res.statusText}: ${s}`));
        }
      })
      .catch(ex => console.log(`LINE notify failed. ${ex}`));
  }
}
