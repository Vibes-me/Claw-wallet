const $ = (id) => document.getElementById(id);

const logs = [];
let wallets = [];

const baseUrlInput = $('baseUrl');
baseUrlInput.value = localStorage.getItem('dashboard:baseUrl') || 'http://localhost:3000';
$('apiKey').value = localStorage.getItem('dashboard:apiKey') || '';

function persistConnection() {
  localStorage.setItem('dashboard:baseUrl', baseUrlInput.value.trim());
  localStorage.setItem('dashboard:apiKey', $('apiKey').value.trim());
}

function addLog(entry) {
  logs.unshift(entry);
  if (logs.length > 25) logs.pop();

  $('requestLogs').innerHTML = logs.map((l) => `
    <tr>
      <td>${new Date(l.time).toLocaleTimeString()}</td>
      <td>${l.method}</td>
      <td>${l.path}</td>
      <td>${l.status}</td>
      <td>${l.limit || '-'}</td>
      <td>${l.remaining || '-'}</td>
      <td>${l.reset ? new Date(Number(l.reset)).toLocaleTimeString() : '-'}</td>
    </tr>
  `).join('');
}

async function api(path, options = {}) {
  persistConnection();
  const base = baseUrlInput.value.trim().replace(/\/$/, '');
  const key = $('apiKey').value.trim();
  const method = options.method || 'GET';

  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(key ? { 'x-api-key': key } : {}),
      ...(options.headers || {})
    }
  });

  const payload = await res.json().catch(() => ({}));
  addLog({
    time: Date.now(),
    method,
    path,
    status: res.status,
    limit: res.headers.get('X-RateLimit-Limit'),
    remaining: res.headers.get('X-RateLimit-Remaining'),
    reset: res.headers.get('X-RateLimit-Reset')
  });

  if (!res.ok) {
    throw new Error(payload.error || `Request failed with status ${res.status}`);
  }
  return payload;
}

function walletSnippet(wallet) {
  return `import AgentWallet from './sdk.js';\n\nconst wallet = new AgentWallet({\n  apiKey: process.env.AGENT_WALLET_API_KEY\n});\n\nconst balance = await wallet.getBalance('${wallet.address}');\nconsole.log(balance);`;
}

function renderWallets(walletRows, balanceRows) {
  wallets = walletRows;
  const byAddress = new Map(balanceRows.map((b) => [b.address, b]));

  $('walletSummary').textContent = `${walletRows.length} wallets loaded.`;
  $('wallets').innerHTML = walletRows.length ? walletRows.map((wallet) => {
    const bal = byAddress.get(wallet.address);
    return `<div class="snippet">
      <strong>${wallet.agentName || wallet.id}</strong><br />
      <span>${wallet.address}</span><br />
      <span class="muted">${wallet.chain}</span><br />
      <span>Balance: ${bal?.balance?.formatted || bal?.error || 'Unavailable'} ${bal?.balance?.symbol || ''}</span>
    </div>`;
  }).join('') : '<div class="muted">No wallets yet.</div>';

  $('snippets').innerHTML = walletRows.length ? walletRows.map((wallet, i) => {
    const snippet = walletSnippet(wallet);
    const id = `snippet-${i}`;
    return `<div class="snippet">
      <strong>${wallet.agentName || wallet.address}</strong>
      <pre id="${id}">${snippet}</pre>
      <button data-copy="${id}">Copy snippet</button>
    </div>`;
  }).join('') : '<div class="muted">SDK snippets appear after wallets are loaded.</div>';

  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.onclick = async () => {
      const target = document.getElementById(btn.dataset.copy);
      await navigator.clipboard.writeText(target.innerText);
      btn.textContent = 'Copied';
      setTimeout(() => (btn.textContent = 'Copy snippet'), 1200);
    };
  });
}

async function refresh() {
  try {
    const [walletList, identities, history] = await Promise.all([
      api('/wallet/list'),
      api('/identity/list'),
      api('/wallet/history?limit=20')
    ]);

    const balances = await Promise.all((walletList.wallets || []).map(async (wallet) => {
      try {
        const result = await api(`/wallet/${wallet.address}/balance?chain=${wallet.chain}`);
        return { address: wallet.address, ...result };
      } catch (error) {
        return { address: wallet.address, error: error.message };
      }
    }));

    renderWallets(walletList.wallets || [], balances);

    $('identities').innerHTML = (identities.identities || []).length
      ? identities.identities.map((id) => `<div class="snippet"><strong>${id.agentName}</strong><br/>${id.id}<br/><span class="muted">${id.agentType}</span></div>`).join('')
      : '<div class="muted">No identities found.</div>';

    $('history').innerHTML = (history.transactions || []).length
      ? history.transactions.slice(0, 20).map((tx) => `<div class="snippet"><strong>${tx.type || 'tx'}</strong> ${tx.hash || ''}<br/><span class="muted">${tx.from || ''} → ${tx.to || ''}</span></div>`).join('')
      : '<div class="muted">No history found.</div>';

    try {
      const apiKeys = await api('/api-keys');
      $('apiKeys').innerHTML = (apiKeys.keys || []).map((k) => `<div class="snippet"><strong>${k.name}</strong><br/>${k.key}<br/><span class="muted">${k.permissions.join(', ')}</span></div>`).join('');
    } catch (error) {
      $('apiKeys').innerHTML = `<div class="muted">API key metadata unavailable (${error.message}). Admin key required.</div>`;
    }
  } catch (error) {
    $('formResult').textContent = `Refresh error: ${error.message}`;
  }
}

async function submitProtected(formId, handler) {
  const form = $(formId);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());

    if (!window.confirm('Please confirm this protected operation before submitting.')) {
      return;
    }

    try {
      const result = await handler(data);
      $('formResult').textContent = JSON.stringify(result, null, 2);
      await refresh();
    } catch (error) {
      $('formResult').textContent = error.message;
    }
  });
}

$('refreshAll').onclick = refresh;
submitProtected('createWalletForm', (data) => api('/wallet/create', {
  method: 'POST',
  body: JSON.stringify({ agentName: data.agentName, chain: data.chain })
}));
submitProtected('sendForm', (data) => api(`/wallet/${data.address}/send`, {
  method: 'POST',
  body: JSON.stringify({ to: data.to, value: data.value, chain: data.chain })
}));
submitProtected('sweepForm', (data) => api(`/wallet/${data.address}/sweep`, {
  method: 'POST',
  body: JSON.stringify({ to: data.to, chain: data.chain })
}));

refresh();
