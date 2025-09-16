import { Application } from "@/lib/types/application"
import jsPDF from "jspdf"
import "jspdf-autotable"

// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export function exportToCSV(applications: Application[], filename: string = "applications") {
  const headers = [
    "ID",
    "Applicant Name",
    "Email",
    "Phone",
    "Status",
    "Risk Score",
    "Amount (KES)",
    "Workflow",
    "Priority",
    "Assigned To",
    "Submitted At",
    "Last Activity",
    "Documents",
    "Notes"
  ]

  const csvContent = [
    headers.join(","),
    ...applications.map(app => [
      app.id,
      `"${app.applicantName}"`,
      app.email,
      app.phone,
      app.status,
      app.riskScore,
      app.amount,
      `"${app.workflow}"`,
      app.priority,
      `"${app.assignedTo}"`,
      new Date(app.submittedAt).toLocaleDateString(),
      new Date(app.lastActivity).toLocaleDateString(),
      app.documents,
      app.notes
    ].join(","))
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export function exportToPDF(applications: Application[], filename: string = "applications") {
  const doc = new jsPDF()
  
  // Add title
  doc.setFontSize(20)
  doc.text("Application Report", 14, 22)
  
  // Add generation date
  doc.setFontSize(12)
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32)
  doc.text(`Total Applications: ${applications.length}`, 14, 40)
  
  // Prepare table data
  const tableColumns = [
    "ID",
    "Applicant",
    "Status",
    "Risk Score",
    "Amount (KES)",
    "Workflow",
    "Priority",
    "Submitted"
  ]
  
  const tableRows = applications.map(app => [
    app.id,
    app.applicantName,
    app.status.charAt(0).toUpperCase() + app.status.slice(1),
    app.riskScore.toString(),
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(app.amount),
    app.workflow,
    app.priority.charAt(0).toUpperCase() + app.priority.slice(1),
    new Date(app.submittedAt).toLocaleDateString()
  ])
  
  // Add table
  doc.autoTable({
    head: [tableColumns],
    body: tableRows,
    startY: 50,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 25 }, // ID
      1: { cellWidth: 30 }, // Applicant
      2: { cellWidth: 20 }, // Status
      3: { cellWidth: 20 }, // Risk Score
      4: { cellWidth: 25 }, // Amount
      5: { cellWidth: 25 }, // Workflow
      6: { cellWidth: 15 }, // Priority
      7: { cellWidth: 20 }, // Submitted
    },
  })
  
  // Add summary statistics
  const finalY = (doc as any).lastAutoTable.finalY || 50
  doc.setFontSize(14)
  doc.text("Summary Statistics", 14, finalY + 20)
  
  // Calculate statistics
  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const avgRiskScore = applications.reduce((sum, app) => sum + app.riskScore, 0) / applications.length
  const totalAmount = applications.reduce((sum, app) => sum + app.amount, 0)
  
  doc.setFontSize(10)
  let yPos = finalY + 30
  
  // Status breakdown
  doc.text("Status Breakdown:", 14, yPos)
  yPos += 8
  Object.entries(statusCounts).forEach(([status, count]) => {
    doc.text(`• ${status.charAt(0).toUpperCase() + status.slice(1)}: ${count}`, 20, yPos)
    yPos += 6
  })
  
  yPos += 5
  doc.text(`Average Risk Score: ${avgRiskScore.toFixed(1)}`, 14, yPos)
  yPos += 8
  doc.text(`Total Amount: ${new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(totalAmount)}`, 14, yPos)
  
  // Save the PDF
  doc.save(`${filename}.pdf`)
}

export function exportFilteredApplications(
  applications: Application[], 
  format: "csv" | "pdf", 
  filename?: string
) {
  const defaultFilename = `applications_${new Date().toISOString().split('T')[0]}`
  const exportFilename = filename || defaultFilename
  
  if (format === "csv") {
    exportToCSV(applications, exportFilename)
  } else {
    exportToPDF(applications, exportFilename)
  }
}