// Copyright 2022 Casbin team (http://elastic.io). All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Adapter, Helper, Model } from 'casbin';
import { Client, ClientOptions } from 'cassandra-driver';

/**
 * Implements a policy adapter for casbin with Cassandra DB.
 *
 * @class
 */
export class CassandraAdapter {
  private client: Client;
  private keySpace: string = 'casbin';
  private rulesTableName: string = 'casbin_rule';

  private constructor(options: ClientOptions) {
    this.client = new Client(options);
    this.createTable();
  }

  /**
   * newAdapter is the constructor.
   * @param options cassandra client option
   */
  public static async newAdapter(
    options: ClientOptions
  ): Promise<CassandraAdapter> {
    const a = new CassandraAdapter(options);
    a.client.connect();
    return a;
  }

  public async addPolicy(
    sec: string,
    ptype: string,
    rule: string[]
  ): Promise<void> {
    const values = ptype + ',' + rule.filter((n) => n).join(',');
    await this.client.execute(
      `INSERT INTO ${this.keySpace}.${this.rulesTableName} ('ptype', 'v1', 'v2', 'v3', 'v4', 'v5') VALUES (${values});`
    );
  }

  public async removePolicy(
    sec: string,
    ptype: string,
    rule: string[]
  ): Promise<void> {
    let condition = `ptype=${ptype}`;
    for (let i = 0; i < rule.length; i++) {
      condition += `, v${i}=${rule[i]}`;
    }
    await this.client.execute(
      `DELETE FROM ${this.rulesTableName} WHERE ${condition};`
    );
  }

  public async addPolicies(
    sec: string,
    ptype: string,
    rules: string[][]
  ): Promise<void> {
    for (const rule of rules) {
      await this.addPolicy(sec, ptype, rule);
    }
    console.log('reached the adapter methds');
  }

  public async removePolicies(
    sec: string,
    ptype: string,
    rules: string[][]
  ): Promise<void> {
    for (const rule of rules) {
      await this.removePolicy(sec, ptype, rule);
    }
  }

  public async removeFilteredPolicy(
    sec: string,
    ptype: string,
    fieldIndex: number,
    ...fieldValues: string[]
  ): Promise<void> {}

  public async getRules(): Promise<void> {
    const res = await this.client.execute(
      `SELECT * FROM ${this.keySpace}.${this.rulesTableName};`
    );
    console.log(res.rows);
  }

  public async loadPolicy(): Promise<void> {
    const result = await this.client.execute(
      `SELECT * FROM ${this.keySpace}.${this.rulesTableName};`
    );
  }

  // public async savePolicy(model: Model): Promise<boolean> {}

  private async createTable(): Promise<void> {
    await this.client.execute(
      `Create keyspace IF NOT EXISTS ${this.keySpace} with replication={'class': 'SimpleStrategy', 'replication_factor': 1};`
    );
    await this.client.execute(
      `CREATE TABLE IF NOT EXISTS ${this.keySpace}.${this.rulesTableName} (ptype varchar, v1 varchar, v2 varchar, v3 varchar, v4 varchar, v5 varchar);`
    );
  }

  public async close(): Promise<void> {
    await this.client.shutdown();
  }
}
