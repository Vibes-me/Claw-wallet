import pkg from '../package.json' with { type: 'json' };

const API_URL = process.env.API_URL || 'http://127.0.0.1:3100';
const expectedVersion = pkg.version;

async function fetchJson(path, init) {
  const response = await fetch(`${API_URL}${path}`, init);
  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`);
  }
  return response.json();
}

async function main() {
  console.log('\n📋 Testing metadata version consistency...');

  const root = await fetchJson('/', {
    headers: { Accept: 'application/json' }
  });
  const health = await fetchJson('/health');
  const dashboard = await fetchJson('/dashboard');
  const onboarding = await fetchJson('/onboarding');

  const versions = {
    root: root.version,
    health: health.version,
    dashboard: dashboard.version,
    onboarding: onboarding.version
  };

  for (const [endpoint, version] of Object.entries(versions)) {
    if (version !== expectedVersion) {
      throw new Error(
        `Version mismatch for ${endpoint}: expected ${expectedVersion}, got ${version}`
      );
    }
  }

  console.log(`✅ Metadata versions are consistent: ${expectedVersion}`);
}

main().catch((error) => {
  console.error(`❌ Metadata version test failed: ${error.message}`);
  process.exit(1);
});
