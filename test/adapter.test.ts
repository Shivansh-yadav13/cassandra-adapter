import { CassandraAdapter } from '../src/adapter';
import { newEnforcer } from 'casbin';

test('Test Adapter', async () => {
  const adapter = await CassandraAdapter.newAdapter({
    contactPoints: ['localhost'],
    localDataCenter: 'datacenter1'
  });
  await adapter.addPolicy('p', 'p', ['alice', 'data1', 'read']);
  // const e = await newEnforcer('examples/basic_model.conf', adapter);
  // expect(await e.addPolicy('alice', 'data1', 'read')).toBe(true);
  await adapter.getRules();
});

