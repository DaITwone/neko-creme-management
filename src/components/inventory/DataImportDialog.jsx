import { useState } from 'react'
import { parseBackup } from '../../services/inventoryTransfer'
import { Dialog, Field, FormFooter } from './InventoryUI'
export default function DataImportDialog({ onImport, onClose }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  return <Dialog title="Nhập dữ liệu từ bản sao kho" onClose={onClose}><form onSubmit={e => { e.preventDefault(); try { if (!data) throw new Error('Chọn bản sao JSON hợp lệ.'); onImport(data) } catch (err) { setError(err.message) } }}><p className="inv-help">Chọn bản sao JSON đã xuất từ trang này. Dữ liệu được kiểm tra và ghép theo ID; nếu xung đột với sổ kho hiện có, thao tác sẽ dừng. CSV dùng để xem trong Excel; dữ liệu Excel gốc đã có trong danh mục.</p><Field label="Bản sao kho (.json, tối đa 20 MB)" type="file" accept=".json,application/json" required onChange={async e => { setData(null); setError(''); try { const file = e.target.files[0]; if (!file) return; if (file.size > 20 * 1024 * 1024) throw new Error('Tệp vượt 20 MB.'); setData(parseBackup(await file.text())) } catch (err) { setError(err.message) } }} error={error} />{data && <p className="mt-4">Đã đọc {data.items.length} nguyên liệu, {data.batches.length} lô, {data.transactions.length} giao dịch và {data.counts.length} phiếu kiểm.</p>}<FormFooter onClose={onClose} label="Xác nhận nhập dữ liệu" /></form></Dialog>
}
