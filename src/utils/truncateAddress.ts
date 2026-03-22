/** Shorten a base58 address for display (e.g. `Abcd…wxyz`). */
export function truncateAddress(address: string, head = 4, tail = 4) {
  if (address.length <= head + tail + 1) return address
  return `${address.slice(0, head)}…${address.slice(-tail)}`
}
