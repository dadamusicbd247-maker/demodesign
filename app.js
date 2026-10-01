/**
 * Admin Portal - Wallet Management, Add Channel, Deposit & Withdraw Logic
 */

// Initial Seed Data for Channels (Cleared as requested by user)
const defaultChannels = [];

// Clear existing dummy channels from localStorage
if (!localStorage.getItem('admin_wallet_channels_cleared')) {
  localStorage.setItem('admin_wallet_channels', JSON.stringify([]));
  localStorage.setItem('admin_wallet_channels_cleared', 'true');
}

let channelsData = JSON.parse(localStorage.getItem('admin_wallet_channels')) || [];

// Default Reminder Templates mapped to Channel options
const channelReminderTemplates = {
  'Cashout': 'Cash Out করার পর অবশ্যই <b>TrxID</b> সাবমিট করবেন।',
  'Send Many': 'Send Money করার পর অবশ্যই <b>TrxID</b> সাবমিট করবেন।',
  'Payment': 'Payment করার পর অবশ্যই <b>TrxID</b> সাবমিট করবেন।'
};

// DOM Elements
const addChannelForm = document.getElementById('addChannelForm');
const walletListBody = document.getElementById('walletListBody');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  initSubTabs();
  initWalletFilterBar();
  renderWalletTable();
  initAddChannelForm();
  initSettingSubTabs();
  initDepositHandler();
  initWithdrawHandler();
  initGatewayManager();
});

// --- Setting Sub-tabs (Deposit, Withdraw & Gateway Switcher) ---
function initSettingSubTabs() {
  const pillDeposit = document.getElementById('pillSettingDeposit');
  const pillWithdraw = document.getElementById('pillSettingWithdraw');
  const pillGateway = document.getElementById('pillSettingGateway');
  const depositSection = document.getElementById('settingDepositSection');
  const withdrawSection = document.getElementById('settingWithdrawSection');
  const gatewaySection = document.getElementById('settingGatewaySection');

  function switchSettingMode(mode) {
    // Reset all tabs active state
    if (pillDeposit) pillDeposit.classList.toggle('active', mode === 'deposit');
    if (pillWithdraw) pillWithdraw.classList.toggle('active', mode === 'withdraw');
    if (pillGateway) pillGateway.classList.toggle('active', mode === 'gateway');

    // Toggle sections visibility
    if (depositSection) depositSection.style.display = mode === 'deposit' ? 'block' : 'none';
    if (withdrawSection) withdrawSection.style.display = mode === 'withdraw' ? 'block' : 'none';
    if (gatewaySection) gatewaySection.style.display = mode === 'gateway' ? 'block' : 'none';
  }

  if (pillDeposit) {
    pillDeposit.addEventListener('click', () => switchSettingMode('deposit'));
  }
  if (pillWithdraw) {
    pillWithdraw.addEventListener('click', () => switchSettingMode('withdraw'));
  }
  if (pillGateway) {
    pillGateway.addEventListener('click', () => switchSettingMode('gateway'));
  }

  window.switchSettingSubTab = switchSettingMode;
}

// --- Gateway Management ON/OFF Controller ---
function initGatewayManager() {
  const defaultGatewayStatus = {
    'manual-pay': true,
    'sorolpay': true,
    'crypto-pay': true
  };

  const storedStatus = JSON.parse(localStorage.getItem('admin_gateways_status')) || defaultGatewayStatus;

  const gatewayIds = ['manual-pay', 'sorolpay', 'crypto-pay'];

  function applyGatewayUI(id, isEnabled) {
    const checkbox = document.getElementById(`switch-${id}`);
    const badge = document.getElementById(`badge-${id}`);
    const textLabel = document.getElementById(`text-${id}`);
    const card = document.getElementById(`card-gateway-${id}`);

    if (checkbox) checkbox.checked = isEnabled;

    if (badge) {
      badge.textContent = isEnabled ? 'ACTIVE' : 'INACTIVE';
      badge.className = `gateway-badge ${isEnabled ? 'active' : 'inactive'}`;
    }

    if (textLabel) {
      textLabel.textContent = isEnabled ? 'ON' : 'OFF';
      textLabel.className = `gateway-toggle-text ${isEnabled ? 'active' : 'inactive'}`;
    }

    if (card) {
      card.classList.toggle('is-off', !isEnabled);
    }
  }

  // Initialize UI with stored states
  gatewayIds.forEach(id => {
    const isEnabled = storedStatus[id] !== false; // default true
    applyGatewayUI(id, isEnabled);

    const checkbox = document.getElementById(`switch-${id}`);
    if (checkbox) {
      checkbox.addEventListener('change', (e) => {
        const checked = e.target.checked;
        const gatewayName = checkbox.getAttribute('data-gateway-name') || id;
        
        storedStatus[id] = checked;
        localStorage.setItem('admin_gateways_status', JSON.stringify(storedStatus));

        applyGatewayUI(id, checked);

        showToast(
          `${gatewayName} gateway is now ${checked ? 'enabled (ON)' : 'disabled (OFF)'}`,
          checked ? 'success' : 'info'
        );
      });
    }
  });
}

// --- Submenu Tab Switching Logic ---
function initSubTabs() {
  const subLinks = document.querySelectorAll('.submenu .sub-link');
  subLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tabTarget = link.getAttribute('data-tab');
      if (tabTarget) {
        switchTab(tabTarget);
      }
    });
  });
}

function switchTab(tabId) {
  // Update sidebar active sub-pill
  document.querySelectorAll('.submenu .sub-link').forEach(link => {
    if (link.getAttribute('data-tab') === tabId) {
      link.classList.add('active-sub-pill');
    } else {
      link.classList.remove('active-sub-pill');
    }
  });

  // Hide all tab panes
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.remove('active');
  });

  // Show target pane
  const targetPane = document.getElementById(`pane-${tabId}`);
  if (targetPane) {
    targetPane.classList.add('active');
  }
}

// --- Universal Rich Text Editor Helper ---
function setupRichTextEditor(editorId, toolbarId, hiddenInputId) {
  const editor = document.getElementById(editorId);
  const toolbar = document.getElementById(toolbarId);
  const hiddenInput = document.getElementById(hiddenInputId);

  if (!editor) return;

  if (toolbar) {
    toolbar.addEventListener('mousedown', (e) => {
      const btn = e.target.closest('.editor-btn');
      if (!btn) return;

      e.preventDefault();
      const command = btn.getAttribute('data-command');
      if (command) {
        document.execCommand(command, false, null);
        updateToolbarState();
        syncContent();
      }
    });
  }

  function updateToolbarState() {
    if (!toolbar) return;
    const buttons = toolbar.querySelectorAll('.editor-btn[data-command]');
    buttons.forEach(btn => {
      const command = btn.getAttribute('data-command');
      try {
        if (document.queryCommandState(command)) {
          btn.classList.add('is-active');
        } else {
          btn.classList.remove('is-active');
        }
      } catch (err) {}
    });
  }

  function syncContent() {
    if (hiddenInput) {
      hiddenInput.value = editor.innerHTML;
    }
  }

  editor.addEventListener('input', syncContent);
  editor.addEventListener('keyup', updateToolbarState);
  editor.addEventListener('mouseup', updateToolbarState);
  editor.addEventListener('focus', updateToolbarState);
}

// --- TAB 1: Add Dp/Wd Wallet Channel ---
function initAddChannelForm() {
  const paymentTypeSelect = document.getElementById('paymentTypeSelect');
  const mobileBankingFields = document.getElementById('mobileBankingFields');
  const cryptoFields = document.getElementById('cryptoFields');
  const channelTypeSelect = document.getElementById('channelTypeSelect');
  const phoneInput = document.getElementById('phoneNumberInput');
  const phoneHint = document.getElementById('phoneValidationHint');

  // Toggle Mobile Banking vs Crypto
  function togglePaymentType(type) {
    if (type === 'Mobile Banking') {
      if (mobileBankingFields) mobileBankingFields.style.display = 'contents';
      if (cryptoFields) cryptoFields.style.display = 'none';
    } else if (type === 'Crypto') {
      if (mobileBankingFields) mobileBankingFields.style.display = 'none';
      if (cryptoFields) cryptoFields.style.display = 'block';
    }
  }

  if (paymentTypeSelect) {
    paymentTypeSelect.addEventListener('change', (e) => {
      const selectedType = e.target.value;
      togglePaymentType(selectedType);
      showToast(`Selected Payment Type: ${selectedType}`, 'info');
    });
    togglePaymentType(paymentTypeSelect.value);
  }

  if (channelTypeSelect) {
    channelTypeSelect.addEventListener('change', (e) => {
      const selectedChannel = e.target.value;
      showToast(`Channel changed: ${selectedChannel}`, 'info');
    });
  }

  // Bangladeshi Phone Number - Digits-only rule & live validation
  if (phoneInput) {
    phoneInput.addEventListener('keydown', (e) => {
      const allowedSpecial = ['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Home', 'End'];
      if (allowedSpecial.includes(e.key) || e.ctrlKey || e.metaKey) return;
      if (!/^[0-9]$/.test(e.key)) e.preventDefault();
    });

    phoneInput.addEventListener('input', (e) => {
      let digits = e.target.value.replace(/\D/g, '');
      if (digits.length > 11) digits = digits.slice(0, 11);
      e.target.value = digits;

      if (!phoneHint) return;
      if (!digits) {
        phoneHint.style.color = 'var(--text-light)';
        phoneHint.textContent = 'Only 11-digit Bangladeshi mobile numbers (01...) are accepted';
      } else if (!digits.startsWith('01')) {
        phoneHint.style.color = '#ef4444';
        phoneHint.textContent = '❌ Number must start with 01';
      } else if (digits.length < 11) {
        phoneHint.style.color = '#d97706';
        phoneHint.textContent = `⚠️ ${11 - digits.length} digit(s) remaining (11 digits required)`;
      } else if (/^01[3-9]\d{8}$/.test(digits)) {
        phoneHint.style.color = '#16a34a';
        phoneHint.textContent = '✓ Valid Bangladeshi mobile number (11 digits)';
      } else {
        phoneHint.style.color = '#ef4444';
        phoneHint.textContent = '❌ Invalid operator code (e.g. 013, 014, 015, 016, 017, 018, 019)';
      }
    });
  }

  // Form submission
  if (addChannelForm) {
    addChannelForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const paymentType = paymentTypeSelect?.value || 'Mobile Banking';
      const gateway = document.getElementById('gatewaySelect')?.value || 'Manual Pay';
      const channel = channelTypeSelect?.value || 'Cashout';
      const method = document.getElementById('paymentMethodSelect')?.value || 'Bkash';
      const phone = phoneInput ? phoneInput.value.trim() : '';

      if (paymentType === 'Mobile Banking') {
        if (!phone) {
          showToast('Please enter a phone number', 'error');
          phoneInput?.focus();
          return;
        }
        if (!/^01[3-9]\d{8}$/.test(phone)) {
          showToast('Please enter a valid 11-digit Bangladeshi mobile number (e.g. 017XXXXXXXX)', 'error');
          phoneInput?.focus();
          return;
        }
      }

      const newChannel = {
        id: Date.now(),
        name: `${method} (${channel})`,
        group: method,
        type: `${gateway} - ${channel}`,
        wallet: phone || 'N/A',
        holder: gateway,
        currency: 'BDT',
        min: 100,
        max: 50000,
        sort: channelsData.length + 1,
        status: 'Active',
        paymentType: paymentType
      };

      channelsData.unshift(newChannel);
      localStorage.setItem('admin_wallet_channels', JSON.stringify(channelsData));
      renderWalletTable();

      if (phoneInput) {
        phoneInput.value = '';
        if (phoneHint) {
          phoneHint.style.color = 'var(--text-light)';
          phoneHint.textContent = 'Only 11-digit Bangladeshi mobile numbers (01...) are accepted';
        }
      }

      showToast(`Channel successfully saved: ${method} (${channel})!`, 'success');
    });
  }
}

// --- TAB 3: Deposit Management ---
function initDepositHandler() {
  const depositPaymentTypeSelect = document.getElementById('depositPaymentTypeSelect');
  const depositMobileBankingFields = document.getElementById('depositMobileBankingFields');
  const depositGatewaySelect = document.getElementById('depositGatewaySelect');
  const depositChannelSelect = document.getElementById('depositChannelSelect');
  const depositReminderEditor = document.getElementById('depositReminderEditor');
  const depositReminderHidden = document.getElementById('depositReminderHiddenInput');
  const minDepositLimit = document.getElementById('minDepositLimit');
  const maxDepositLimit = document.getElementById('maxDepositLimit');
  const depositForm = document.getElementById('depositForm');

  if (!depositForm) return;

  // Toggle Crypto vs Mobile Banking in Deposit
  function toggleDepositPaymentType(type) {
    const depositCryptoFields = document.getElementById('depositCryptoFields');
    if (type === 'Mobile Banking') {
      if (depositMobileBankingFields) depositMobileBankingFields.style.display = 'contents';
      if (depositCryptoFields) depositCryptoFields.style.display = 'none';
    } else if (type === 'Crypto') {
      if (depositMobileBankingFields) depositMobileBankingFields.style.display = 'none';
      if (depositCryptoFields) depositCryptoFields.style.display = 'block';
    }
  }

  if (depositPaymentTypeSelect) {
    depositPaymentTypeSelect.addEventListener('change', (e) => {
      const type = e.target.value;
      toggleDepositPaymentType(type);
      showToast(`Deposit Payment Type: ${type}`, 'info');
    });
    toggleDepositPaymentType(depositPaymentTypeSelect.value);
  }

  // Update dynamic reminder text on Deposit channel change
  function updateDepositReminder(channel) {
    const template = channelReminderTemplates[channel] || `${channel} করার পর অবশ্যই <b>TrxID</b> সাবমিট করবেন।`;
    if (depositReminderEditor) {
      depositReminderEditor.innerHTML = template;
      if (depositReminderHidden) depositReminderHidden.value = template;
    }
  }

  if (depositChannelSelect) {
    depositChannelSelect.addEventListener('change', (e) => {
      const selectedChannel = e.target.value;
      updateDepositReminder(selectedChannel);
      showToast(`Deposit Channel: ${selectedChannel}`, 'info');
    });
  }

  // Setup rich text editor for Deposit
  setupRichTextEditor('depositReminderEditor', 'depositEditorToolbar', 'depositReminderHiddenInput');

  // Load saved settings if any
  const savedDeposit = JSON.parse(localStorage.getItem('admin_deposit_settings'));
  if (savedDeposit) {
    if (depositPaymentTypeSelect && savedDeposit.paymentType) {
      depositPaymentTypeSelect.value = savedDeposit.paymentType;
      toggleDepositPaymentType(savedDeposit.paymentType);
    }
    if (depositGatewaySelect && savedDeposit.gateway) {
      depositGatewaySelect.value = savedDeposit.gateway;
    }
    if (depositChannelSelect && savedDeposit.channel) {
      depositChannelSelect.value = savedDeposit.channel;
    }
    if (depositReminderEditor && savedDeposit.reminder) {
      depositReminderEditor.innerHTML = savedDeposit.reminder;
      if (depositReminderHidden) depositReminderHidden.value = savedDeposit.reminder;
    } else if (depositChannelSelect) {
      updateDepositReminder(depositChannelSelect.value);
    }
    if (minDepositLimit && savedDeposit.minLimit != null) {
      minDepositLimit.value = savedDeposit.minLimit;
    }
    if (maxDepositLimit && savedDeposit.maxLimit != null) {
      maxDepositLimit.value = savedDeposit.maxLimit;
    }
  } else if (depositChannelSelect) {
    updateDepositReminder(depositChannelSelect.value);
  }

  // Deposit Form Submit
  depositForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const paymentType = depositPaymentTypeSelect?.value || 'Mobile Banking';
    const gateway = depositGatewaySelect?.value || 'Manual Pay';
    const channel = depositChannelSelect?.value || 'Cashout';
    const reminder = depositReminderEditor?.innerHTML || '';
    const minLimit = minDepositLimit?.value ? Number(minDepositLimit.value) : null;
    const maxLimit = maxDepositLimit?.value ? Number(maxDepositLimit.value) : null;

    const depositSettings = {
      paymentType,
      gateway,
      channel,
      reminder,
      minLimit,
      maxLimit,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem('admin_deposit_settings', JSON.stringify(depositSettings));

    let limitInfo = '';
    if (minLimit != null || maxLimit != null) {
      limitInfo = ` (Min: ${minLimit ?? 0}, Max: ${maxLimit ?? '∞'})`;
    }
    showToast(`Deposit সেটিংস সফলভাবে সেভ হয়েছে!${limitInfo}`, 'success');
  });
}

// --- TAB 4: Withdraw Management ---
function initWithdrawHandler() {
  const withdrawReminderEditor = document.getElementById('withdrawReminderEditor');
  const withdrawReminderHidden = document.getElementById('withdrawReminderHiddenInput');
  const minWithdrawLimit = document.getElementById('minWithdrawLimit');
  const maxWithdrawLimit = document.getElementById('maxWithdrawLimit');
  const withdrawForm = document.getElementById('withdrawForm');

  if (!withdrawForm) return;

  // Setup rich text editor for Withdraw
  setupRichTextEditor('withdrawReminderEditor', 'withdrawEditorToolbar', 'withdrawReminderHiddenInput');

  const defaultWithdrawReminder = 'টাকা উত্তোলনের জন্য অবশ্যই আপনার সঠিক <b>একাউন্ট নম্বর</b> ও তথ্যাদি নিশ্চিত করুন।';

  // Load saved settings if any
  const savedWithdraw = JSON.parse(localStorage.getItem('admin_withdraw_settings'));
  if (savedWithdraw) {
    if (withdrawReminderEditor && savedWithdraw.reminder) {
      withdrawReminderEditor.innerHTML = savedWithdraw.reminder;
      if (withdrawReminderHidden) withdrawReminderHidden.value = savedWithdraw.reminder;
    } else if (withdrawReminderEditor) {
      withdrawReminderEditor.innerHTML = defaultWithdrawReminder;
      if (withdrawReminderHidden) withdrawReminderHidden.value = defaultWithdrawReminder;
    }
    if (minWithdrawLimit && savedWithdraw.minLimit != null) {
      minWithdrawLimit.value = savedWithdraw.minLimit;
    }
    if (maxWithdrawLimit && savedWithdraw.maxLimit != null) {
      maxWithdrawLimit.value = savedWithdraw.maxLimit;
    }
  } else if (withdrawReminderEditor) {
    withdrawReminderEditor.innerHTML = defaultWithdrawReminder;
    if (withdrawReminderHidden) withdrawReminderHidden.value = defaultWithdrawReminder;
  }

  // Withdraw Form Submit
  withdrawForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const reminder = withdrawReminderEditor?.innerHTML || '';
    const minLimit = minWithdrawLimit?.value ? Number(minWithdrawLimit.value) : null;
    const maxLimit = maxWithdrawLimit?.value ? Number(maxWithdrawLimit.value) : null;

    const withdrawSettings = {
      reminder,
      minLimit,
      maxLimit,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem('admin_withdraw_settings', JSON.stringify(withdrawSettings));

    let limitInfo = '';
    if (minLimit != null || maxLimit != null) {
      limitInfo = ` (Min: ${minLimit ?? 0}, Max: ${maxLimit ?? '∞'})`;
    }
    showToast(`Withdraw সেটিংস সফলভাবে সেভ হয়েছে!${limitInfo}`, 'success');
  });
}

// --- Wallet Filter Bar State & Logic ---
let currentGatewayFilter = 'all'; // 'all', 'Manual Pay', 'Sorolpay', 'Crypto'
let currentSearchQuery = '';

function matchesGateway(ch, gateway) {
  if (!ch) return false;
  const target = gateway.toLowerCase();
  if (target === 'all') return true;
  if (target === 'crypto') {
    return (ch.paymentType && ch.paymentType.toLowerCase() === 'crypto') ||
           (ch.holder && ch.holder.toLowerCase().includes('crypto')) ||
           (ch.type && ch.type.toLowerCase().includes('crypto')) ||
           (ch.currency && (ch.currency.toLowerCase() === 'usdt' || ch.currency.toLowerCase() === 'crypto'));
  }
  const holder = (ch.holder || '').toLowerCase();
  const type = (ch.type || '').toLowerCase();
  return holder === target || type.includes(target);
}

function initWalletFilterBar() {
  const filterBtns = document.querySelectorAll('.gateway-filter-btn');
  const searchInput = document.getElementById('walletSearchInput');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');
      currentGatewayFilter = filter;
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderWalletTable();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value.trim().toLowerCase();
      renderWalletTable();
    });
  }
}

// --- Render Wallet Table ---
function renderWalletTable() {
  if (!walletListBody) return;

  // Update Gateway Count Badges
  const countAll = channelsData.length;
  const countManual = channelsData.filter(c => matchesGateway(c, 'Manual Pay')).length;
  const countSorolpay = channelsData.filter(c => matchesGateway(c, 'Sorolpay')).length;
  const countCrypto = channelsData.filter(c => matchesGateway(c, 'Crypto')).length;

  const elAll = document.getElementById('count-all');
  const elManual = document.getElementById('count-manual-pay');
  const elSorolpay = document.getElementById('count-sorolpay');
  const elCrypto = document.getElementById('count-crypto');

  if (elAll) elAll.textContent = countAll;
  if (elManual) elManual.textContent = countManual;
  if (elSorolpay) elSorolpay.textContent = countSorolpay;
  if (elCrypto) elCrypto.textContent = countCrypto;

  // Filter channels according to active gateway option and search term
  let filtered = currentGatewayFilter === 'all'
    ? channelsData
    : channelsData.filter(c => matchesGateway(c, currentGatewayFilter));

  if (currentSearchQuery) {
    const q = currentSearchQuery.toLowerCase();
    filtered = filtered.filter(c => 
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.wallet && c.wallet.toLowerCase().includes(q)) ||
      (c.type && c.type.toLowerCase().includes(q)) ||
      (c.holder && c.holder.toLowerCase().includes(q))
    );
  }

  if (channelsData.length === 0) {
    walletListBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 36px 20px; color: var(--text-muted); font-size: 13.5px;"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#94a3b8" stroke-width="1.8" style="margin-bottom: 8px; display: block; margin-left: auto; margin-right: auto;"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>কোনো চ্যানেল পাওয়া যায়নি। আপনি নতুন চ্যানেল যোগ করতে পারেন।</td></tr>`;
    return;
  }

  if (filtered.length === 0) {
    const filterText = currentGatewayFilter === 'all' ? '' : ` "${currentGatewayFilter}"`;
    walletListBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 36px 20px; color: var(--text-muted); font-size: 13.5px;"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#94a3b8" stroke-width="1.8" style="margin-bottom: 8px; display: block; margin-left: auto; margin-right: auto;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>${filterText} গেটওয়ে বা সার্চ ফিল্টারে কোনো চ্যানেল পাওয়া যায়নি।</td></tr>`;
    return;
  }

  walletListBody.innerHTML = filtered.map(ch => {
    const initials = ch.name.substring(0, 2).toUpperCase();
    return `
      <tr>
        <td>
          <span class="gateway-tag">${ch.holder}</span>
        </td>
        <td>
          <div class="channel-pill-tag">
            <div class="channel-avatar">${initials}</div>
            <div>
              <strong>${ch.name}</strong>
            </div>
          </div>
        </td>
        <td><code>${ch.wallet}</code></td>
        <td><span style="font-weight:600;">${ch.currency}</span></td>
        <td>
          <span class="channel-status-badge ${ch.status === 'Active' ? 'is-active' : 'is-deactive'}">
            <span class="status-dot"></span>
            ${ch.status}
          </span>
        </td>
        <td>
          <select 
            class="table-action-select" 
            onchange="handleChannelAction(${ch.id}, this.value)"
            title="Select action"
          >
            <option value="" disabled selected>Action ▾</option>
            <option value="Active" ${ch.status === 'Active' ? 'disabled' : ''}>Active</option>
            <option value="Deactive" ${ch.status === 'Deactive' ? 'disabled' : ''}>Deactive</option>
            <option value="delete" style="color: #ef4444; font-weight: 600;">Delete</option>
          </select>
        </td>
      </tr>
    `;
  }).join('');
}

// --- Action Column Handler (Active / Deactive / Delete) ---
window.handleChannelAction = function(id, action) {
  if (action === 'delete') {
    deleteChannel(id);
    return;
  }
  const channel = channelsData.find(c => c.id === id);
  if (channel) {
    channel.status = action;
    localStorage.setItem('admin_wallet_channels', JSON.stringify(channelsData));
    renderWalletTable();
    showToast(`Channel "${channel.name}" is now ${action}!`, action === 'Active' ? 'success' : 'info');
  }
};
window.updateChannelStatus = window.handleChannelAction;

// --- Delete Channel ---
window.deleteChannel = function(id) {
  const channel = channelsData.find(c => c.id === id);
  const name = channel ? channel.name : 'this channel';
  if (confirm(`Are you sure you want to remove ${name}?`)) {
    channelsData = channelsData.filter(c => c.id !== id);
    localStorage.setItem('admin_wallet_channels', JSON.stringify(channelsData));
    renderWalletTable();
    showToast(`Channel "${name}" removed`, 'info');
  } else {
    renderWalletTable();
  }
};

// --- Toast System ---
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      ${type === 'success' 
        ? '<polyline points="20 6 9 17 4 12"></polyline>' 
        : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>'}
    </svg>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}
