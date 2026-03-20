import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { InvoiceData } from "@/lib/clients/invoices";

const DEFAULT_COLOR = "#1a6b3c";

function hexToLightBg(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.round(c * 0.08 + 255 * 0.92);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

function createStyles(color: string) {
  const lightBg = hexToLightBg(color);

  return StyleSheet.create({
    page: {
      padding: 40,
      fontSize: 10,
      fontFamily: "Helvetica",
      color: "#333",
    },
    // Header
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    headerLeft: {
      flex: 1,
    },
    headerRight: {
      flex: 1,
      alignItems: "flex-end",
    },
    sellerName: {
      fontSize: 14,
      fontFamily: "Helvetica-Bold",
      color: "#222",
      marginBottom: 4,
    },
    invoiceNumber: {
      fontSize: 12,
      color: "#444",
      marginBottom: 6,
    },
    headerDateRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginBottom: 2,
    },
    headerDateLabel: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: "#555",
      marginRight: 4,
    },
    headerDateValue: {
      fontSize: 9,
      color,
      fontFamily: "Helvetica-Bold",
    },
    // Parties section (Seller / Customer)
    partiesRow: {
      flexDirection: "row",
      marginTop: 30,
      gap: 40,
    },
    partyCol: {
      flex: 1,
    },
    partyLabel: {
      fontSize: 9,
      color: "#888",
      marginBottom: 4,
    },
    partyName: {
      fontSize: 16,
      fontFamily: "Helvetica-Bold",
      color,
      marginBottom: 6,
    },
    partyDetail: {
      fontSize: 9,
      marginBottom: 2,
      color: "#555",
    },
    // Services table
    tableContainer: {
      marginTop: 30,
      borderWidth: 1,
      borderColor: "#c0c0c0",
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: lightBg,
      borderBottomWidth: 1,
      borderBottomColor: "#c0c0c0",
      paddingVertical: 8,
      paddingHorizontal: 10,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#e8e8e8",
      paddingVertical: 8,
      paddingHorizontal: 10,
      minHeight: 30,
      alignItems: "center",
    },
    tableRowLast: {
      borderBottomWidth: 0,
    },
    thText: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color,
    },
    tdText: {
      fontSize: 9,
      color: "#444",
    },
    colService: { flex: 3 },
    colQty: { width: 50, textAlign: "center" },
    colPrice: { width: 80, textAlign: "right" },
    colSum: { width: 80, textAlign: "right" },
    // Totals
    totalsContainer: {
      marginTop: 16,
      alignItems: "flex-end",
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      width: 240,
      paddingVertical: 4,
    },
    totalLabel: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color,
      textAlign: "right",
      flex: 1,
    },
    totalValue: {
      fontSize: 10,
      textAlign: "right",
      width: 100,
    },
    grandTotalLabel: {
      fontSize: 14,
      fontFamily: "Helvetica-Bold",
      color,
      textAlign: "right",
      flex: 1,
    },
    grandTotalValue: {
      fontSize: 18,
      fontFamily: "Helvetica-Bold",
      color,
      textAlign: "right",
      width: 120,
    },
    // Bank details (bottom section)
    bankContainer: {
      marginTop: 24,
      backgroundColor: lightBg,
      borderWidth: 1,
      borderColor: "#c0c0c0",
      padding: 16,
    },
    bankDetail: {
      fontSize: 9,
      marginBottom: 3,
      color: "#444",
    },
    bankSeparator: {
      borderBottomWidth: 1,
      borderBottomColor: "#c0c0c0",
      marginVertical: 8,
    },
    bankSubheading: {
      fontSize: 9,
      color,
      marginBottom: 3,
    },
    // Notes
    notesContainer: {
      marginTop: 30,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: "#e0e0e0",
    },
    notesLabel: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: "#555",
      marginBottom: 4,
    },
    notesText: {
      fontSize: 9,
      color: "#555",
    },
  });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatAmount(amount: number, currency: string): string {
  return `${currency === "USD" ? "$" : currency} ${Number(
    amount,
  ).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function buildCustomerAddress(c: InvoiceData["customer"]): string {
  const parts = [
    c.address_line_1,
    c.address_line_2,
    [c.city, c.state, c.zip].filter(Boolean).join(", "),
    c.country,
  ].filter(Boolean);
  return parts.join("\n");
}

interface InvoicePdfProps {
  invoice: InvoiceData;
  themeColor?: string;
}

export function InvoicePdf({ invoice, themeColor }: InvoicePdfProps) {
  const styles = createStyles(themeColor || DEFAULT_COLOR);
  const bank = invoice.bank_account;
  const customer = invoice.customer;
  const sellerName = bank?.beneficiary_full_name ?? "";
  const customerName = customer.display_name || customer.legal_name;
  const customerAddress = buildCustomerAddress(customer);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header: Seller name (left) / Invoice info (right) */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.sellerName}>{sellerName}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceNumber}>
              Invoice #{invoice.invoice_number}
            </Text>
            <View style={styles.headerDateRow}>
              <Text style={styles.headerDateLabel}>Creation date:</Text>
              <Text style={styles.headerDateValue}>
                {formatDate(invoice.issue_date)}
              </Text>
            </View>
            <View style={styles.headerDateRow}>
              <Text style={styles.headerDateLabel}>Due date:</Text>
              <Text style={styles.headerDateValue}>
                {formatDate(invoice.due_date)}
              </Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={{ borderBottomWidth: 1, borderBottomColor: "#e0e0e0", marginTop: 16, marginBottom: 16 }} />

        {/* Seller / Customer */}
        <View style={styles.partiesRow}>
          <View style={styles.partyCol}>
            <Text style={styles.partyLabel}>Bill From:</Text>
            <Text style={styles.partyName}>{sellerName}</Text>
            {bank?.beneficiary_full_address && (
              <Text style={styles.partyDetail}>
                Address: {bank.beneficiary_full_address}
              </Text>
            )}
          </View>

          <View style={styles.partyCol}>
            <Text style={styles.partyLabel}>Bill To:</Text>
            <Text style={styles.partyName}>{customerName}</Text>
            {customer.tax_id && (
              <Text style={styles.partyDetail}>
                Registration code: {customer.tax_id}
              </Text>
            )}
            {customerAddress && (
              <Text style={styles.partyDetail}>Address: {customerAddress}</Text>
            )}
          </View>
        </View>

        {/* Services table */}
        <View style={styles.tableContainer}>
          {/* Table header */}
          <View style={styles.tableHeader}>
            <View style={styles.colService}>
              <Text style={styles.thText}>Service</Text>
            </View>
            <View style={styles.colQty}>
              <Text style={styles.thText}>Qty</Text>
            </View>
            <View style={styles.colPrice}>
              <Text style={styles.thText}>Price</Text>
            </View>
            <View style={styles.colSum}>
              <Text style={styles.thText}>Sum</Text>
            </View>
          </View>

          {/* Table rows */}
          {invoice.services.map((svc, idx) => (
            <View
              key={svc.id}
              style={[
                styles.tableRow,
                idx === invoice.services.length - 1 ? styles.tableRowLast : {},
              ]}
            >
              <View style={styles.colService}>
                <Text style={styles.tdText}>{svc.service_title}</Text>
                {svc.service_description && (
                  <Text style={[styles.tdText, { color: "#888", fontSize: 8 }]}>
                    {svc.service_description}
                  </Text>
                )}
              </View>
              <View style={styles.colQty}>
                <Text style={styles.tdText}>1</Text>
              </View>
              <View style={styles.colPrice}>
                <Text style={styles.tdText}>
                  {formatAmount(svc.amount, invoice.currency)}
                </Text>
              </View>
              <View style={styles.colSum}>
                <Text style={styles.tdText}>
                  {formatAmount(svc.amount, invoice.currency)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={[styles.totalRow, { marginTop: 8 }]}>
            <Text style={styles.grandTotalLabel}>Total price</Text>
            <Text style={styles.grandTotalValue}>
              {formatAmount(invoice.total_amount, invoice.currency)}
            </Text>
          </View>
        </View>

        {/* Bank Details */}
        {bank && (
          <View style={styles.bankContainer}>
            <Text style={styles.bankDetail}>
              {"\u2022"} Beneficiary{"'"}s Full Name: {bank.beneficiary_full_name}
            </Text>
            {bank.beneficiary_full_address && (
              <Text style={styles.bankDetail}>
                {"\u2022"} Beneficiary{"'"}s Full Address: {bank.beneficiary_full_address}
              </Text>
            )}
            <View style={styles.bankSeparator} />
            <Text style={styles.bankDetail}>
              {"\u2022"} Bank Account Number: {bank.beneficiary_account_number}
            </Text>
            <Text style={styles.bankDetail}>
              {"\u2022"} SWIFT Code of Receiving Bank: {bank.swift_code}
            </Text>
            {bank.bank_name && (
              <Text style={styles.bankDetail}>
                {"\u2022"} Bank Name: {bank.bank_name}
              </Text>
            )}
            {bank.intermediary_bank_info && (
              <>
                <View style={styles.bankSeparator} />
                <Text style={styles.bankSubheading}>
                  Intermediary Bank (depending on currency):
                </Text>
                <Text style={styles.bankDetail}>
                  {bank.intermediary_bank_info}
                </Text>
              </>
            )}
          </View>
        )}

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
