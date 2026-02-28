/**
 * Export Service
 *
 * Accounting-friendly exports for transaction history.
 */

import { queryTransactions } from './tx-history.js';

const EXPORT_FIELDS = [
  'hash',
  'chain',
  'timestamp',
  'from',
  'to',
  'grossAmount',
  'gas',
  'fee',
  'netAmount',
  'status',
  'metadataTags'
];

function csvEscape(value) {
  const str = value == null ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function flattenRecord(tx) {
  return {
    hash: tx.hash,
    chain: tx.chain,
    timestamp: tx.timestamp,
    from: tx.from,
    to: tx.to,
    grossAmount: tx.grossAmount,
    gas: tx.gas,
    fee: tx.fee,
    netAmount: tx.netAmount,
    status: tx.status,
    metadataTags: (tx.metadata?.tags || []).join('|')
  };
}

function toCsv(records) {
  const header = EXPORT_FIELDS.join(',');
  const lines = records.map(record => (
    EXPORT_FIELDS.map(field => csvEscape(record[field])).join(',')
  ));
  return [header, ...lines].join('\n');
}

function toJsonl(records) {
  return records.map(record => JSON.stringify(record)).join('\n');
}

export function exportTransactions({ format = 'csv', from, to, wallet, agent, chain } = {}) {
  const transactions = queryTransactions({ from, to, wallet, agent, chain });
  const flatRecords = transactions.map(flattenRecord);

  if (format === 'jsonl') {
    return {
      contentType: 'application/x-ndjson; charset=utf-8',
      filename: 'wallet-history.jsonl',
      content: toJsonl(flatRecords),
      count: flatRecords.length,
      fields: EXPORT_FIELDS
    };
  }

  return {
    contentType: 'text/csv; charset=utf-8',
    filename: 'wallet-history.csv',
    content: toCsv(flatRecords),
    count: flatRecords.length,
    fields: EXPORT_FIELDS
  };
}

export function getExportFields() {
  return [...EXPORT_FIELDS];
}
