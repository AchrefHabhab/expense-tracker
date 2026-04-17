'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { exportTransactionsCSV, getMonthlyReportData } from '../_actions/export-actions';
import type { ReportData } from '../_actions/export-actions';

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function generatePDF(data: ReportData) {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(20);
  doc.setTextColor(5, 150, 105);
  doc.text('Expense Tracker', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(23, 23, 23);
  doc.text(`Monthly Report — ${data.month} ${data.year}`, pageWidth / 2, 30, { align: 'center' });

  doc.setDrawColor(228, 228, 231);
  doc.line(20, 35, pageWidth - 20, 35);

  doc.setFontSize(11);
  doc.setTextColor(113, 113, 122);

  const summaryY = 45;
  const col1 = 25;
  const col2 = pageWidth / 2 + 10;

  doc.text('Total Income', col1, summaryY);
  doc.setTextColor(5, 150, 105);
  doc.setFont('helvetica', 'bold');
  doc.text(`$${data.totalIncome.toFixed(2)}`, col1, summaryY + 7);

  doc.setTextColor(113, 113, 122);
  doc.setFont('helvetica', 'normal');
  doc.text('Total Expenses', col2, summaryY);
  doc.setTextColor(239, 68, 68);
  doc.setFont('helvetica', 'bold');
  doc.text(`$${data.totalExpenses.toFixed(2)}`, col2, summaryY + 7);

  doc.setTextColor(113, 113, 122);
  doc.setFont('helvetica', 'normal');
  doc.text('Balance', col1, summaryY + 18);
  doc.setTextColor(data.balance >= 0 ? 5 : 239, data.balance >= 0 ? 150 : 68, data.balance >= 0 ? 105 : 68);
  doc.setFont('helvetica', 'bold');
  doc.text(`$${data.balance.toFixed(2)}`, col1, summaryY + 25);

  doc.setTextColor(113, 113, 122);
  doc.setFont('helvetica', 'normal');
  doc.text('Savings Rate', col2, summaryY + 18);
  doc.setTextColor(16, 185, 129);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.savingsRate.toFixed(1)}%`, col2, summaryY + 25);

  if (data.categoryBreakdown.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(23, 23, 23);
    doc.text('Spending by Category', col1, summaryY + 40);

    const catRows = data.categoryBreakdown.map((c) => [
      `${c.emoji} ${c.category}`,
      `$${c.amount.toFixed(2)}`,
      `${c.percent.toFixed(1)}%`,
    ]);

    autoTable(doc, {
      startY: summaryY + 45,
      head: [['Category', 'Amount', '% of Expenses']],
      body: catRows,
      theme: 'grid',
      headStyles: {
        fillColor: [5, 150, 105],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: { fontSize: 9, textColor: [23, 23, 23] },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      margin: { left: col1, right: 25 },
    });
  }

  const afterCatY = (doc as unknown as Record<string, Record<string, number>>).lastAutoTable?.finalY ?? summaryY + 90;
  const txStartY = afterCatY + 15;

  if (txStartY > 250) doc.addPage();

  const txY = txStartY > 250 ? 20 : txStartY;
  doc.setFontSize(13);
  doc.setTextColor(23, 23, 23);
  doc.setFont('helvetica', 'normal');
  doc.text('Transactions', 25, txY);

  const txRows = data.transactions.map((t) => [
    t.date,
    t.description,
    t.type === 'income' ? 'Income' : 'Expense',
    t.category,
    `${t.type === 'expense' ? '-' : '+'}$${t.amount.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: txY + 5,
    head: [['Date', 'Description', 'Type', 'Category', 'Amount']],
    body: txRows,
    theme: 'grid',
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8, textColor: [23, 23, 23] },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles: {
      4: { halign: 'right' },
    },
    margin: { left: 25, right: 25 },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(161, 161, 170);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} — Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`expense-report-${data.month.toLowerCase()}-${data.year}.pdf`);
}

export function ExportMenu() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const handleCSV = () => {
    startTransition(async () => {
      const result = await exportTransactionsCSV(month, year);
      if (result.success && result.data) {
        downloadBlob(result.data, `transactions-${year}-${month + 1}.csv`, 'text/csv');
        toast.success('CSV downloaded');
      } else {
        toast.error(result.error ?? 'Export failed');
      }
      setOpen(false);
    });
  };

  const handlePDF = () => {
    startTransition(async () => {
      const result = await getMonthlyReportData(month, year);
      if (result.success && result.data) {
        await generatePDF(result.data);
        toast.success('PDF report downloaded');
      } else {
        toast.error(result.error ?? 'Report generation failed');
      }
      setOpen(false);
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
      >
        <Download className="size-3.5" />
        Export
        <ChevronDown className={`size-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-lg border border-border bg-card shadow-lg"
            >
              <button
                onClick={handleCSV}
                disabled={isPending}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                <FileSpreadsheet className="size-4 text-income" />
                <div>
                  <p className="font-medium">Export CSV</p>
                  <p className="text-[10px] text-muted-foreground">This month&apos;s transactions</p>
                </div>
              </button>
              <div className="border-t border-border" />
              <button
                onClick={handlePDF}
                disabled={isPending}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                <FileText className="size-4 text-expense" />
                <div>
                  <p className="font-medium">Monthly Report</p>
                  <p className="text-[10px] text-muted-foreground">PDF with charts & summary</p>
                </div>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
