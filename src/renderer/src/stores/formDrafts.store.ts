import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ContractData, QuotationData, AdvanceRequestData } from '../../../shared/types'
import { DEFAULT_BEN_B } from '../../../shared/types'

const getTodayParts = () => {
  const today = new Date()
  return {
    day: String(today.getDate()).padStart(2, '0'),
    month: String(today.getMonth() + 1).padStart(2, '0'),
    year: String(today.getFullYear())
  }
}

export const createInitialContractData = (): ContractData => {
  const { day, month, year } = getTodayParts()
  return {
    so_hd: `${day}${month}/${year}/HĐNT/LH-VK`,
    ngay: day,
    thang: month,
    nam: year,
    noi_dung_mua_ban: 'mua bán vật tư, vật liệu xây dựng',
    file_name: 'HopDong_Mau.docx',
    export_dir: '',
    export_type: 'word',
    bena_xung_danh: 'Ông',
    bena_ten_cong_ty: '',
    bena_dai_dien: '',
    bena_chuc_vu: 'Giám đốc',
    bena_dia_chi: '',
    bena_tai_khoan: '',
    bena_mst: '',
    ...DEFAULT_BEN_B
  }
}

export const createInitialQuotationData = (): QuotationData => {
  const { day, month, year } = getTodayParts()
  return {
    ngay: day,
    thang: month,
    nam: year,
    ten_khach_hang: '',
    file_name: 'BaoGia.docx',
    export_dir: '',
    export_type: 'word',
    co_ghi_chu: false,
    items: [
      { id: '1', stt: '01', ten_hang: '', ghi_chu: '', don_vi: 'M³', don_gia: '', phan_tram_tang: '', don_gia_sau_tang: '' }
    ]
  }
}

export const createInitialAdvanceRequestData = (): AdvanceRequestData => {
  const { day, month, year } = getTodayParts()
  return {
    ngay: day,
    thang: month,
    nam: year,
    ten_cong_ty_khach: '',
    noi_dung_cung_cap: 'đá các loại',
    dot_tam_ung: '1',
    ngay_don_hang: day,
    thang_don_hang: month,
    nam_don_hang: year,
    items: [
      {
        id: '1',
        stt: 1,
        ten_vat_tu: 'Cấp phối đá dăm Dmax 37,5',
        don_vi: 'M3',
        so_luong: '2.000',
        don_gia: '363.000',
        thanh_tien: '726.000.000 ₫',
        ghi_chu: 'Mỏ Hòn Ngang'
      },
      {
        id: '2',
        stt: 2,
        ten_vat_tu: 'Đá BTN 1,9*2,5',
        don_vi: 'M3',
        so_luong: '500',
        don_gia: '625.000',
        thanh_tien: '312.500.000 ₫',
        ghi_chu: ''
      }
    ],
    dieu_kien_thanh_toan: 'Thanh toán trước 100% đơn hàng',
    tong_tien: '1.038.500.000 ₫',
    gia_tri_don_hang: '1.038.500.000 ₫',
    gia_tri_tam_ung: '1.038.500.000 ₫',
    so_tien_bang_chu: 'Một tỷ không trăm ba mươi tám triệu năm trăm nghìn đồng./.',
    file_name: 'DeNghiTamUng.docx',
    export_dir: '',
    export_type: 'word'
  }
}

interface FormDraftsStore {
  contractDraft: ContractData
  quotationDraft: QuotationData
  advanceRequestDraft: AdvanceRequestData

  setContractDraft: (updater: Partial<ContractData> | ((prev: ContractData) => ContractData)) => void
  resetContractDraft: () => void

  setQuotationDraft: (updater: Partial<QuotationData> | ((prev: QuotationData) => QuotationData)) => void
  resetQuotationDraft: () => void

  setAdvanceRequestDraft: (updater: Partial<AdvanceRequestData> | ((prev: AdvanceRequestData) => AdvanceRequestData)) => void
  resetAdvanceRequestDraft: () => void
}

export const useFormDraftsStore = create<FormDraftsStore>()(
  persist(
    (set, get) => ({
      contractDraft: createInitialContractData(),
      quotationDraft: createInitialQuotationData(),
      advanceRequestDraft: createInitialAdvanceRequestData(),

      setContractDraft: (updater) => {
        const prev = get().contractDraft
        const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
        set({ contractDraft: next })
      },
      resetContractDraft: () => {
        set({ contractDraft: createInitialContractData() })
      },

      setQuotationDraft: (updater) => {
        const prev = get().quotationDraft
        const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
        set({ quotationDraft: next })
      },
      resetQuotationDraft: () => {
        set({ quotationDraft: createInitialQuotationData() })
      },

      setAdvanceRequestDraft: (updater) => {
        const prev = get().advanceRequestDraft
        const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
        set({ advanceRequestDraft: next })
      },
      resetAdvanceRequestDraft: () => {
        set({ advanceRequestDraft: createInitialAdvanceRequestData() })
      }
    }),
    {
      name: 'vietkey_form_drafts_v1'
    }
  )
)
