/**
 * OperationPrintView — proper print layout (hidden on screen, visible on print)
 * Includes: logo, reference, contact, schedule date, product lines, responsible, signature line.
 * Use window.print() to trigger; browser allows Save as PDF.
 */
export default function OperationPrintView({ op }: { op: any }) {
  if (!op) return null

  const typeLabels: Record<string, string> = {
    RECEIPT: 'RECEIPT / GOODS RECEIVED NOTE',
    DELIVERY: 'DELIVERY NOTE',
    INTERNAL: 'INTERNAL TRANSFER',
    ADJUSTMENT: 'STOCK ADJUSTMENT',
  }

  return (
    <div className="hidden print:block">
      <style>{`
        @page { size: A4; margin: 20mm 18mm; }
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: fixed; top: 0; left: 0; width: 100%; }
        }
      `}</style>

      <div className="print-area font-sans text-gray-900 text-sm leading-relaxed">
        {/* Header */}
        <div className="flex justify-between items-start pb-6 mb-6 border-b-2 border-gray-900">
          <div className="flex flex-col gap-1">
            {/* Logo — use img if available, else text */}
            <img
              src="/logo.png"
              alt="Stocksense"
              className="h-10 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="text-xs text-gray-500 mt-1">Inventory Management System</span>
          </div>
          <div className="text-right">
            <h1 className="text-xl font-bold text-gray-800 uppercase tracking-wide">
              {typeLabels[op.type] || op.type}
            </h1>
            <p className="text-2xl font-bold mt-1 font-mono">{op.reference || '—'}</p>
            <p className="text-sm text-gray-500 mt-0.5">Status: {op.status}</p>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-10 mb-8">
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-gray-500 uppercase text-xs tracking-widest mb-1">Document Details</h3>
            <div className="flex gap-2">
              <span className="font-medium w-28 shrink-0">Schedule Date:</span>
              <span>{op.scheduleDate ? new Date(op.scheduleDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}</span>
            </div>
            {op.doneAt && (
              <div className="flex gap-2">
                <span className="font-medium w-28 shrink-0">Completed:</span>
                <span>{new Date(op.doneAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
              </div>
            )}
            <div className="flex gap-2">
              <span className="font-medium w-28 shrink-0">Responsible:</span>
              <span>{op.responsible?.fullName || '—'}</span>
            </div>
            {op.operationTypeNote && (
              <div className="flex gap-2">
                <span className="font-medium w-28 shrink-0">Operation Type:</span>
                <span>{op.operationTypeNote}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-gray-500 uppercase text-xs tracking-widest mb-1">Parties & Locations</h3>
            {op.contact?.name && (
              <div className="flex gap-2">
                <span className="font-medium w-24 shrink-0">
                  {op.type === 'RECEIPT' ? 'Vendor:' : 'Customer:'}
                </span>
                <span>{op.contact.name}</span>
              </div>
            )}
            {op.deliveryAddress && (
              <div className="flex gap-2">
                <span className="font-medium w-24 shrink-0">Delivery To:</span>
                <span>{op.deliveryAddress}</span>
              </div>
            )}
            {op.sourceLocation?.name && (
              <div className="flex gap-2">
                <span className="font-medium w-24 shrink-0">From:</span>
                <span>{op.sourceLocation.name}</span>
              </div>
            )}
            {op.destLocation?.name && (
              <div className="flex gap-2">
                <span className="font-medium w-24 shrink-0">To:</span>
                <span>{op.destLocation.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Products table */}
        <div className="mb-10">
          <h3 className="font-semibold text-gray-500 uppercase text-xs tracking-widest mb-3">Products</h3>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300 bg-gray-50">
                <th className="py-2 px-3 text-left font-semibold">#</th>
                <th className="py-2 px-3 text-left font-semibold">Product</th>
                <th className="py-2 px-3 text-left font-semibold">SKU</th>
                <th className="py-2 px-3 text-right font-semibold">Demand Qty</th>
                <th className="py-2 px-3 text-right font-semibold">Done Qty</th>
                {op.type === 'ADJUSTMENT' && (
                  <th className="py-2 px-3 text-right font-semibold">Counted Qty</th>
                )}
              </tr>
            </thead>
            <tbody>
              {(op.lines || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-400 italic">No products.</td>
                </tr>
              ) : (
                (op.lines || []).map((line: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-200">
                    <td className="py-2 px-3 text-gray-500">{idx + 1}</td>
                    <td className="py-2 px-3 font-medium">{line.product?.name || '—'}</td>
                    <td className="py-2 px-3 text-gray-500 font-mono text-xs">{line.product?.sku || '—'}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{Number(line.quantity)}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{line.countedQuantity ?? Number(line.quantity)}</td>
                    {op.type === 'ADJUSTMENT' && (
                      <td className="py-2 px-3 text-right tabular-nums">
                        {line.countedQuantity != null ? Number(line.countedQuantity) : Number(line.quantity)}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Signature line */}
        <div className="grid grid-cols-3 gap-8 mt-16 pt-6 border-t border-gray-200">
          <div className="flex flex-col items-center gap-1">
            <div className="w-full border-b border-gray-400 mb-2 h-8" />
            <span className="text-xs text-gray-500 text-center">Prepared By</span>
            <span className="text-sm font-medium text-center">{op.responsible?.fullName || '—'}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-full border-b border-gray-400 mb-2 h-8" />
            <span className="text-xs text-gray-500 text-center">Checked By</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-full border-b border-gray-400 mb-2 h-8" />
            <span className="text-xs text-gray-500 text-center">Approved By</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
          Generated by Stocksense IMS · {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
      </div>
    </div>
  )
}
