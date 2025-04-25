import './style.css';
import * as bitcoin from 'bitcoinjs-lib';
import * as bip39 from 'bip39';

document.getElementById('app').innerHTML = `
  <h1>Wallet Scanner</h1>
  <button id="generateBtn">Generate & Check Wallet</button>
  <div id="results"></div>
  <div id="errorLog" class="error" style="display:none;"></div>
`;

document.getElementById('generateBtn').addEventListener('click', generateAndCheck);

async function generateAndCheck() {
  const errorLog = document.getElementById("errorLog");
  errorLog.style.display = "none";
  errorLog.textContent = "";

  try {
    const mnemonic = bip39.generateMnemonic();
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const root = bitcoin.bip32.fromSeed(seed);
    const child = root.derivePath("m/44'/0'/0'/0/0");
    const { address } = bitcoin.payments.p2pkh({ pubkey: child.publicKey });
    const wif = child.toWIF();

    const div = document.createElement("div");
    div.className = "result";
    div.innerHTML = `<p><strong>Address:</strong> ${address}</p><p><strong>Private Key:</strong> ${wif}</p><p id="bal-${address}">Checking balance...</p>`;
    document.getElementById("results").prepend(div);

    const res = await fetch("https://blockstream.info/api/address/" + address);
    if (!res.ok) {
      document.getElementById("bal-" + address).textContent = "Failed to check balance.";
      return;
    }

    const data = await res.json();
    const balance = (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) / 100000000;
    const balText = balance > 0 ? `<span class='balance'>Balance: ${balance} BTC</span>` : "No balance";
    document.getElementById("bal-" + address).innerHTML = balText;
  } catch (err) {
    errorLog.style.display = "block";
    errorLog.textContent = "Error: " + err.message;
  }
}
