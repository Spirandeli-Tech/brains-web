import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { InvoiceData } from "@/lib/clients/invoices";

const GREEN = "#1a6b3c";
const LIGHT_GREEN = "#f0faf4";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#333",
  },
  // Header
  title: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: GREEN,
  },
  invoiceNumber: {
    fontSize: 12,
    color: GREEN,
    marginTop: 2,
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
    color: GREEN,
    marginBottom: 6,
  },
  partyDetail: {
    fontSize: 9,
    marginBottom: 2,
    color: "#555",
  },
  // Dates section
  datesRow: {
    flexDirection: "row",
    marginTop: 30,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 40,
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#555",
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 10,
  },
  // Services table
  tableContainer: {
    marginTop: 30,
    borderWidth: 1,
    borderColor: "#c0c0c0",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: LIGHT_GREEN,
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
    color: GREEN,
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
    color: GREEN,
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
    color: GREEN,
    textAlign: "right",
    flex: 1,
  },
  grandTotalValue: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: GREEN,
    textAlign: "right",
    width: 120,
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
}

export function InvoicePdf({ invoice }: InvoicePdfProps) {
  const bank = invoice.bank_account;
  const customer = invoice.customer;
  const sellerName = bank?.beneficiary_full_name ?? "";
  const customerName = customer.display_name || customer.legal_name;
  const customerAddress = buildCustomerAddress(customer);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <Text style={styles.title}>Invoice</Text>
        <Text style={styles.invoiceNumber}>Nr. {invoice.invoice_number}</Text>

        {/* Seller / Customer */}
        <View style={styles.partiesRow}>
          {/* Seller */}
          <View style={styles.partyCol}>
            <Text style={styles.partyLabel}>Seller</Text>
            <Text style={styles.partyName}>{sellerName}</Text>
            {bank?.beneficiary_full_address && (
              <Text style={styles.partyDetail}>
                Address: {bank.beneficiary_full_address}
              </Text>
            )}
            {bank && (
              <>
                <Text style={styles.partyDetail}>
                  IBAN: {bank.beneficiary_account_number}
                </Text>
                <Text style={styles.partyDetail}>BIC: {bank.swift_code}</Text>
                {bank.bank_name && (
                  <Text style={styles.partyDetail}>Bank: {bank.bank_name}</Text>
                )}
              </>
            )}
          </View>

          {/* Customer */}
          <View style={styles.partyCol}>
            <Text style={styles.partyLabel}>Customer</Text>
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

        {/* Dates */}
        <View style={styles.datesRow}>
          <View style={styles.dateCol}>
            <Text style={styles.dateLabel}>Invoice Date</Text>
            <Text style={styles.dateValue}>
              {formatDate(invoice.issue_date)}
            </Text>
          </View>
          <View style={styles.dateCol}>
            <Text style={styles.dateLabel}>Due Date</Text>
            <Text style={styles.dateValue}>{formatDate(invoice.due_date)}</Text>
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
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {formatAmount(invoice.total_amount, invoice.currency)}
            </Text>
          </View>
          <View style={[styles.totalRow, { marginTop: 8 }]}>
            <Text style={styles.grandTotalLabel}>Total price</Text>
            <Text style={styles.grandTotalValue}>
              {formatAmount(invoice.total_amount, invoice.currency)}
            </Text>
          </View>
        </View>

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
