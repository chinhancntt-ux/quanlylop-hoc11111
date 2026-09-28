import { Student } from '../types';

export interface HonorBoardDrawOptions {
  students: Student[];
  schoolName: string;
  departmentName?: string;
  className: string;
  schoolYear: string;
  teacherName?: string;
  dateStr: string;
  title?: string;
  subtitle?: string;
}

export function drawHonorBoardToCanvas(
  canvas: HTMLCanvasElement,
  options: HonorBoardDrawOptions
): void {
  const {
    students,
    schoolName,
    departmentName = 'UBND XÃ NGUYỄN VIỆT KHÁI',
    className,
    schoolYear,
    dateStr,
    title = 'BẢNG VÀNG DANH DỰ',
    subtitle = 'TUYÊN DƯƠNG HỌC SINH XUẤT SẮC & TIÊU BIỂU',
  } = options;

  const width = 1200;
  const rowHeight = 56;
  const headerHeight = 340;
  const sloganHeight = 80;
  const tableHeight = students.length * rowHeight + 50;
  const height = headerHeight + tableHeight + sloganHeight + 70;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Background Fill
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // 2. Elegant Double Border
  // Outer Border (Navy)
  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = 5;
  ctx.strokeRect(24, 24, width - 48, height - 48);

  // Inner Border (Gold)
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 2;
  ctx.strokeRect(34, 34, width - 68, height - 68);

  // Corner Ornaments
  ctx.fillStyle = '#d97706';
  ctx.font = 'bold 20px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✦', 48, 48);
  ctx.fillText('✦', width - 48, 48);
  ctx.fillText('✦', 48, height - 48);
  ctx.fillText('✦', width - 48, height - 48);

  // 3. School Header
  ctx.textAlign = 'center';
  
  // Upper Department: UBND XÃ NGUYỄN VIỆT KHÁI
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  ctx.fillText(departmentName.toUpperCase(), width / 2, 80);

  // School Name (PROMINENT)
  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
  ctx.fillText(schoolName.toUpperCase(), width / 2, 115);

  // Thin separator under school name
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 140, 130);
  ctx.lineTo(width / 2 + 140, 130);
  ctx.stroke();

  // Main Title
  ctx.fillStyle = '#b45309';
  ctx.font = '900 36px system-ui, -apple-system, sans-serif';
  ctx.fillText(title, width / 2, 185);

  // Subtitle
  ctx.fillStyle = '#334155';
  ctx.font = '700 16px system-ui, -apple-system, sans-serif';
  ctx.fillText(subtitle, width / 2, 222);

  // Class & Year Badge line
  const metaText = `Lớp: ${className}   •   Năm học: ${schoolYear}   •   ${dateStr}`;
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
  ctx.fillText(metaText, width / 2, 260);

  // Decorative divider
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(80, 285);
  ctx.lineTo(width - 80, 285);
  ctx.stroke();

  // 4. Table Setup
  const tableX = 60;
  const tableWidth = width - 120;
  let currentY = 320;

  // Column definitions
  const cols = [
    { label: 'HẠNG', x: tableX, w: 100, align: 'center' },
    { label: 'HỌ VÀ TÊN HỌC SINH', x: tableX + 100, w: 380, align: 'left' },
    { label: 'MÃ HS', x: tableX + 480, w: 140, align: 'center' },
    { label: 'TỔ', x: tableX + 620, w: 120, align: 'center' },
    { label: 'TỔNG SAO', x: tableX + 740, w: 140, align: 'center' },
    { label: 'DANH HIỆU KHEN THƯỞNG', x: tableX + 880, w: 200, align: 'left' },
  ];

  // Table Header Background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(tableX, currentY, tableWidth, 44);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.strokeRect(tableX, currentY, tableWidth, 44);

  // Table Header Labels
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.textBaseline = 'middle';

  cols.forEach((col) => {
    ctx.textAlign = col.align as CanvasTextAlign;
    const textX = col.align === 'center' ? col.x + col.w / 2 : col.x + 16;
    ctx.fillText(col.label, textX, currentY + 22);
  });

  currentY += 44;

  // Render Rows
  students.forEach((stu, index) => {
    const rank = index + 1;
    const isGold = rank === 1;
    const isSilver = rank === 2;
    const isBronze = rank === 3;

    // Row Background
    if (isGold) {
      ctx.fillStyle = '#fefce8'; // soft gold tint
    } else if (isSilver) {
      ctx.fillStyle = '#f8fafc'; // soft silver tint
    } else if (isBronze) {
      ctx.fillStyle = '#fff7ed'; // soft bronze tint
    } else if (index % 2 === 1) {
      ctx.fillStyle = '#fbfcfe';
    } else {
      ctx.fillStyle = '#ffffff';
    }

    ctx.fillRect(tableX, currentY, tableWidth, rowHeight);

    // Row border bottom
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tableX, currentY + rowHeight);
    ctx.lineTo(tableX + tableWidth, currentY + rowHeight);
    ctx.stroke();

    const rowMidY = currentY + rowHeight / 2;

    // 1. Rank
    ctx.textAlign = 'center';
    if (isGold) {
      ctx.fillStyle = '#d97706';
      ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
      ctx.fillText('🥇 #1', tableX + 50, rowMidY);
    } else if (isSilver) {
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
      ctx.fillText('🥈 #2', tableX + 50, rowMidY);
    } else if (isBronze) {
      ctx.fillStyle = '#c2410c';
      ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
      ctx.fillText('🥉 #3', tableX + 50, rowMidY);
    } else {
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
      ctx.fillText(`#${rank}`, tableX + 50, rowMidY);
    }

    // 2. Student Name
    ctx.textAlign = 'left';
    ctx.fillStyle = isGold ? '#b45309' : '#0f172a';
    ctx.font = isGold ? 'bold 17px system-ui, sans-serif' : '600 16px system-ui, sans-serif';
    const avatar = stu.avatar ? `${stu.avatar}  ` : '';
    ctx.fillText(`${avatar}${stu.name}`, tableX + 116, rowMidY);

    // 3. Student Code
    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    ctx.font = '14px monospace, sans-serif';
    ctx.fillText(stu.code || `HS-${String(index + 1).padStart(3, '0')}`, tableX + 480 + 70, rowMidY);

    // 4. Group
    ctx.textAlign = 'center';
    ctx.fillStyle = '#334155';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText(stu.group || 'Tổ 1', tableX + 620 + 60, rowMidY);

    // 5. Stars
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d97706';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText(`${stu.stars} ⭐`, tableX + 740 + 70, rowMidY);

    // 6. Title / Honor
    ctx.textAlign = 'left';
    let honorTitle = 'Học Sinh Chăm Chỉ 🌟';
    if (rank === 1) honorTitle = 'Thủ Khoa Xuất Sắc 👑';
    else if (rank === 2) honorTitle = 'Á Khoa Gương Mẫu 🥈';
    else if (rank === 3) honorTitle = 'Hoa Sao Chăm Ngoan 🥉';
    else if (stu.stars >= 40) honorTitle = 'Học Sinh Ưu Tú ⭐';
    else if (stu.stars >= 25) honorTitle = 'Búp Măng Tích Cực 🌟';

    ctx.fillStyle = isGold ? '#b45309' : '#475569';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText(honorTitle, tableX + 880 + 16, rowMidY);

    currentY += rowHeight;
  });

  // Table outer border
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.strokeRect(tableX, 320, tableWidth, currentY - 320);

  // 5. Motivational Slogan Box
  currentY += 28;
  ctx.fillStyle = '#fffbeb';
  ctx.fillRect(tableX, currentY, tableWidth, 44);
  ctx.strokeStyle = '#fed7aa';
  ctx.strokeRect(tableX, currentY, tableWidth, 44);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#92400e';
  ctx.font = 'italic 15px system-ui, sans-serif';
  ctx.fillText(
    '“Nhiệt liệt biểu dương tinh thần chăm ngoan, rèn luyện tích cực và thành tích xuất sắc của các em học sinh!”',
    width / 2,
    currentY + 22
  );
}
