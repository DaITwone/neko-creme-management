import {
  Building2,
  CircleDollarSign,
  ClipboardCheck,
  PackageSearch,
  Settings,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react'

export const trainingCourses = [
  {
    id: 1,
    title: 'Lịch sử hình thành 7-Eleven',
    description:
      'Tìm hiểu lịch sử thương hiệu, giá trị cốt lõi và hành trình phát triển.',
    icon: Building2,
    color: 'bg-brand-green',
    progress: 100,
    lessons: 2,
    duration: '30 phút',
    materials: [
      {
        id: 1,
        title: 'Lịch sử hình thành 7-Eleven',
        type: 'image',
        url: '/training/lich-su-hinh-thanh.png',
      },
    ],
  },
  {
    id: 2,
    title: 'Quản lý cơ sở vật chất, trang thiết bị, máy móc và dụng cụ',
    description:
      'Quy trình kiểm tra, sử dụng và bảo trì máy móc, thiết bị, dụng cụ.',
    icon: Settings,
    color: 'bg-sky-600',
    progress: 70,
    lessons: 2,
    duration: '45 phút',
    materials: [
      {
        id: 1,
        title: 'Quản lý cơ sở vật chất',
        type: 'image',
        url: '/training/co-so-vat-chat.png',
      },
      {
        id: 2,
        title: 'Quản lý trang thiết bị, máy móc và dụng cụ',
        type: 'image',
        url: '/training/trang-thiet-bi.png',
      },
    ],
  },
  {
    id: 3,
    title: 'Quản lý hàng hóa và vật tư',
    description:
      'Kiểm soát nhập hàng, tồn kho, FIFO, FEFO và hạn sử dụng.',
    icon: PackageSearch,
    color: 'bg-brand-orange',
    progress: 82,
    lessons: 2,
    duration: '60 phút',
    materials: [
      {
        id: 1,
        title: 'Quản lý hàng hóa và vật tư',
        type: 'image',
        url: '/training/quan-ly-hang-hoa.png',
      },
    ],
  },
  {
    id: 4,
    title: 'Quản lý tiền và doanh thu',
    description:
      'Kiểm soát tiền mặt, bàn giao ca, két tiền và doanh thu cửa hàng.',
    icon: CircleDollarSign,
    color: 'bg-emerald-600',
    progress: 45,
    lessons: 1,
    duration: '50 phút',
    materials: [
      {
        id: 1,
        title: 'Quy trình bàn giao tiền cuối ca',
        type: 'image',
        url: '/training/quan-ly-doanh-thu.png',
      },
    ],
  },
  {
    id: 5,
    title: 'Quản lý nhân sự',
    description:
      'Phân công ca, hướng dẫn nghiệp vụ và đánh giá hiệu suất nhân viên.',
    icon: Users,
    color: 'bg-violet-600',
    progress: 60,
    lessons: 1,
    duration: '70 phút',
    materials: [
      {
        id: 1,
        title: 'Quy trình đào tạo nhân viên mới',
        type: 'pdf',
        url: '/training/quan-ly-nhan-su.pdf',
      },
    ],
  },
  {
    id: 6,
    title: 'Tối ưu trải nghiệm khách hàng',
    description:
      'Tiêu chuẩn dịch vụ và quy trình xử lý phản hồi của khách hàng.',
    icon: Star,
    color: 'bg-amber-500',
    progress: 30,
    lessons: 1,
    duration: '45 phút',
    materials: [
      {
        id: 1,
        title: 'Tiêu chuẩn phục vụ khách hàng',
        type: 'pdf',
        url: '/training/trai-nghiem-khach-hang.pdf',
      },
    ],
  },
  {
    id: 7,
    title: 'Tối ưu hiệu quả kinh doanh',
    description:
      'Theo dõi KPI, doanh thu, chi phí, thất thoát và hiệu quả vận hành.',
    icon: TrendingUp,
    color: 'bg-brand-red',
    progress: 20,
    lessons: 1,
    duration: '60 phút',
    materials: [
      {
        id: 1,
        title: 'Các chỉ số vận hành cửa hàng',
        type: 'pdf',
        url: '/training/hieu-qua-kinh-doanh.pdf',
      },
    ],
  },
  {
    id: 8,
    title: 'Thực hiện các loại báo cáo',
    description:
      'Hướng dẫn lập báo cáo doanh thu, tồn kho, nhân sự và sự cố.',
    icon: ClipboardCheck,
    color: 'bg-slate-700',
    progress: 0,
    lessons: 1,
    duration: '40 phút',
    materials: [
      {
        id: 1,
        title: 'Hướng dẫn lập báo cáo vận hành',
        type: 'pdf',
        url: '/training/bao-cao-van-hanh.pdf',
      },
    ],
  },
]