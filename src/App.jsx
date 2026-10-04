import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Clock, 
  Building2, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Download, 
  Upload, 
  Filter, 
  ShieldCheck, 
  Users, 
  CheckCircle2,
  X,
  Edit3,
  Search,
  Grid,
  List
} from 'lucide-react';

const DEFAULT_ROOMS = [
  '221', '222', 'M226', 'M227', 'M228', 'M229', 'M241', 
  '239', '243', '汀州', '特需', '謝跟診(235)', '葉跟診(228)', 
  '吳跟診(241)', '江跟診(229)', '趙跟診(226)'
];

const TIME_SLOTS = [
  { id: 'morning', label: '上午', sub: '08:30 - 12:00' },
  { id: 'afternoon', label: '下午', sub: '13:30 - 17:00' },
  { id: 'evening', label: '晚班', sub: '17:30 - 21:00' }
];

const INITIAL_STAFF = [
  '江(門診)', '趙幼晴', '鍾宜蓁', '特別沉', '葉庭妤', '陳冠衡', 
  '張家愷', '張元青', '張耀元', '劉紋觀', '江合堃', '黃皇誠', 
  '吳(門診)', '伍盛暉', '侯心予', '張鈞合', '潘育華', '陳致衡'
];

// Helper to format Date objects to YYYY-MM-DD
const formatDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Generate realistic initial shift data
const generateInitialSchedules = () => {
  const schedules = {};
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  // Populate first 20 days of current month
  for (let day = 1; day <= 20; day++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    schedules[dateKey] = [];

    // Morning shifts
    schedules[dateKey].push({
      id: `${dateKey}-m-1`,
      slot: 'morning',
      room: '221',
      staff: '江(門診)',
      note: '固定看診'
    });
    schedules[dateKey].push({
      id: `${dateKey}-m-2`,
      slot: 'morning',
      room: 'M226',
      staff: '趙幼晴',
      note: ''
    });
    schedules[dateKey].push({
      id: `${dateKey}-m-3`,
      slot: 'morning',
      room: 'M227',
      staff: '鍾宜蓁',
      note: ''
    });

    // Afternoon shifts
    schedules[dateKey].push({
      id: `${dateKey}-a-1`,
      slot: 'afternoon',
      room: '222',
      staff: '葉庭妤',
      note: '教學門診'
    });
    schedules[dateKey].push({
      id: `${dateKey}-a-2`,
      slot: 'afternoon',
      room: 'M228',
      staff: '張耀元',
      note: ''
    });
  }

  return schedules;
};

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mode, setMode] = useState('manager'); // 'manager' | 'user'
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'dayMatrix'
  const [selectedDateKey, setSelectedDateKey] = useState(formatDateKey(new Date()));
  
  const [schedules, setSchedules] = useState(() => {
    const saved = localStorage.getItem('clinic_schedules');
    return saved ? JSON.parse(saved) : generateInitialSchedules();
  });

  const [rooms, setRooms] = useState(DEFAULT_ROOMS);
  const [staffList, setStaffList] = useState(INITIAL_STAFF);

  // Filters
  const [filterRoom, setFilterRoom] = useState('ALL');
  const [filterStaff, setFilterStaff] = useState('ALL');

  // Booking Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    id: null,
    dateKey: '',
    slot: 'morning',
    room: rooms[0] || '221',
    staff: '',
    note: ''
  });

  const [conflictWarning, setConflictWarning] = useState('');

  // Persist schedules to LocalStorage
  useEffect(() => {
    localStorage.setItem('clinic_schedules', JSON.stringify(schedules));
  }, [schedules]);

  const checkConflicts = (dateKey, slot, room, staff, currentId = null) => {
    const daySchedules = schedules[dateKey] || [];

    // 1. Check if room is already booked in this slot
    const roomConflict = daySchedules.find(
      s => s.slot === slot && s.room === room && s.id !== currentId
    );
    if (roomConflict) {
      return `【診間衝突】${room} 診間在此時段已有排班：${roomConflict.staff}`;
    }

    // 2. Check if staff is scheduled elsewhere at the same time
    if (staff && staff.trim() !== '') {
      const staffConflict = daySchedules.find(
        s => s.slot === slot && s.staff === staff && s.id !== currentId
      );
      if (staffConflict) {
        return `【人員衝突】${staff} 在此時段已於 ${staffConflict.room} 診間有排班！`;
      }
    }

    return null;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateKey(formatDateKey(today));
  };

  const openBookingModal = (dateKey, slot = 'morning', room = rooms[0], existing = null) => {
    const initialStaff = existing ? existing.staff : (staffList[0] || '');
    if (existing) {
      setModalData({ ...existing, dateKey });
    } else {
      setModalData({
        id: null,
        dateKey,
        slot,
        room,
        staff: initialStaff,
        note: ''
      });
    }
    setConflictWarning('');
    setIsModalOpen(true);
  };

  const handleSaveSchedule = (e) => {
    e.preventDefault();
    const { id, dateKey, slot, room, staff, note } = modalData;

    if (!staff.trim()) {
      alert('請填寫排班/預約人員姓名！');
      return;
    }

    // Conflict Check
    const conflict = checkConflicts(dateKey, slot, room, staff, id);
    if (conflict && !window.confirm(`${conflict}\n\n是否仍然強制儲存？`)) {
      return;
    }

    setSchedules(prev => {
      const dayList = prev[dateKey] ? [...prev[dateKey]] : [];
      if (id) {
        // Update
        const idx = dayList.findIndex(item => item.id === id);
        if (idx !== -1) {
          dayList[idx] = { id, slot, room, staff, note };
        }
      } else {
        // Create
        dayList.push({
          id: `${dateKey}-${Date.now()}`,
          slot,
          room,
          staff,
          note
        });
      }
      return { ...prev, [dateKey]: dayList };
    });

    setIsModalOpen(false);
  };

  const handleDeleteSchedule = (id) => {
    if (!window.confirm('確定要刪除這筆排班/預約紀錄嗎？')) return;
    setSchedules(prev => {
      const dayList = (prev[selectedDateKey] || []).filter(item => item.id !== id);
      return { ...prev, [selectedDateKey]: dayList };
    });
    setIsModalOpen(false);
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(schedules, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `clinic_schedule_${formatDateKey(new Date())}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportData = (e) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (typeof parsed === 'object') {
            setSchedules(parsed);
            alert('班表資料匯入成功！');
          }
        } catch (err) {
          alert('匯入失敗：檔案格式不正確！');
        }
      };
    }
  };

  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
    const totalDays = lastDayOfMonth.getDate();

    const days = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({ date: d, isCurrentMonth: false, key: formatDateKey(d) });
    }

    // Current month
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, isCurrentMonth: true, key: formatDateKey(d) });
    }

    // Next month padding to complete 35 or 42 cells grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false, key: formatDateKey(d) });
    }

    return days;
  }, [currentDate]);

  const filteredDaySchedules = useMemo(() => {
    const list = schedules[selectedDateKey] || [];
    return list.filter(item => {
      const matchRoom = filterRoom === 'ALL' || item.room === filterRoom;
      const matchStaff = filterStaff === 'ALL' || item.staff.includes(filterStaff);
      return matchRoom && matchStaff;
    });
  }, [schedules, selectedDateKey, filterRoom, filterStaff]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          
          {/* App Title & Date Nav */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xl">
              <CalendarIcon className="w-7 h-7" />
              <span>診間班表系統</span>
            </div>

            <div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-1">
              <button 
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-white rounded-md transition text-slate-600"
                title="上一個月"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={handleToday}
                className="px-3 py-1 text-sm font-medium hover:bg-white rounded-md transition text-slate-700"
              >
                今天
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-white rounded-md transition text-slate-600"
                title="下一個月"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <span className="text-lg font-bold text-slate-700">
              {currentDate.getFullYear()} 年 {currentDate.getMonth() + 1} 月
            </span>
          </div>

          {/* Mode Switcher & Tools */}
          <div className="flex items-center space-x-3">
            {/* Manager vs User Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setMode('manager')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition ${
                  mode === 'manager' 
                    ? 'bg-indigo-600 text-white shadow' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>管理者模式 (大班表)</span>
              </button>
              <button
                onClick={() => setMode('user')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition ${
                  mode === 'user' 
                    ? 'bg-teal-600 text-white shadow' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>一般預約模式</span>
              </button>
            </div>

            {/* Import / Export JSON */}
            <div className="flex items-center space-x-1">
              <button 
                onClick={handleExportData}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                title="匯出班表 JSON"
              >
                <Download className="w-5 h-5" />
              </button>
              <label 
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                title="匯入班表 JSON"
              >
                <Upload className="w-5 h-5" />
                <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      </header>

      {}
      <main className="max-w-7xl mx-auto w-full p-4 flex-1 flex flex-col gap-6">
        
        {/* Controls and Filters Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-slate-500">視圖模式:</span>
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center space-x-1 px-3 py-1.5 text-sm rounded-lg font-medium border ${
                viewMode === 'month' 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>整月概覽</span>
            </button>
            <button
              onClick={() => setViewMode('dayMatrix')}
              className={`flex items-center space-x-1 px-3 py-1.5 text-sm rounded-lg font-medium border ${
                viewMode === 'dayMatrix' 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <List className="w-4 h-4" />
              <span>當日診間矩陣</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-3 text-sm">
            <div className="flex items-center space-x-1 text-slate-500">
              <Filter className="w-4 h-4" />
              <span>篩選:</span>
            </div>
            
            {/* Room Filter */}
            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="ALL">所有診間</option>
              {rooms.map(r => (
                <option key={r} value={r}>{r} 診間</option>
              ))}
            </select>

            {/* Staff Filter */}
            <select
              value={filterStaff}
              onChange={(e) => setFilterStaff(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="ALL">所有人員/醫師</option>
              {staffList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {}
        {viewMode === 'month' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center font-semibold text-slate-600 text-sm py-2">
              <div className="text-rose-500">週日</div>
              <div>週一</div>
              <div>週二</div>
              <div>週三</div>
              <div>週四</div>
              <div>週五</div>
              <div className="text-indigo-500">週六</div>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200 bg-slate-100">
              {monthDays.map(({ date, isCurrentMonth, key }) => {
                const daySchedules = schedules[key] || [];
                const isSelected = key === selectedDateKey;
                const isToday = key === formatDateKey(new Date());

                // Filter items according to global filter
                const displayedSchedules = daySchedules.filter(item => {
                  const matchRoom = filterRoom === 'ALL' || item.room === filterRoom;
                  const matchStaff = filterStaff === 'ALL' || item.staff.includes(filterStaff);
                  return matchRoom && matchStaff;
                });

                return (
                  <div
                    key={key}
                    onClick={() => {
                      setSelectedDateKey(key);
                      setViewMode('dayMatrix');
                    }}
                    className={`min-h-[110px] p-2 bg-white flex flex-col justify-between cursor-pointer transition hover:bg-indigo-50/40 ${
                      !isCurrentMonth ? 'text-slate-300 bg-slate-50/50' : 'text-slate-700'
                    } ${isSelected ? 'ring-2 ring-indigo-500 z-10' : ''}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-sm font-semibold rounded-full w-6 h-6 flex items-center justify-center ${
                        isToday ? 'bg-indigo-600 text-white' : ''
                      }`}>
                        {date.getDate()}
                      </span>
                      {daySchedules.length > 0 && (
                        <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full border">
                          {daySchedules.length} 診
                        </span>
                      )}
                    </div>

                    {/* Schedule Badges in Month Cell */}
                    <div className="space-y-1 flex-1 overflow-hidden">
                      {displayedSchedules.slice(0, 3).map(s => (
                        <div 
                          key={s.id}
                          className={`text-[11px] truncate px-1.5 py-0.5 rounded font-medium border flex items-center justify-between ${
                            s.slot === 'morning' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                            s.slot === 'afternoon' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                            'bg-purple-50 text-purple-800 border-purple-200'
                          }`}
                        >
                          <span className="truncate">{s.room}: {s.staff}</span>
                        </div>
                      ))}
                      {displayedSchedules.length > 3 && (
                        <div className="text-[10px] text-slate-400 font-medium pl-1">
                          +{displayedSchedules.length - 3} 更多...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {}
        {viewMode === 'dayMatrix' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-4">
            
            {/* Day Header & Actions */}
            <div className="flex flex-wrap justify-between items-center pb-3 border-b border-slate-200 gap-2">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {selectedDateKey} 診間細節排班
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  點選下方表格任意空位以【{mode === 'manager' ? '指派班表' : '預約診間'}】
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openBookingModal(selectedDateKey)}
                  className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>新增診間排班</span>
                </button>
              </div>
            </div>

            {/* Time Slot x Room Matrix Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-xs font-bold uppercase border-b border-slate-200">
                    <th className="p-3 w-32 border-r border-slate-200 sticky left-0 bg-slate-100">時段 / 診間</th>
                    {rooms.map(room => (
                      <th key={room} className="p-3 text-center border-r border-slate-200 min-w-[100px]">
                        {room}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {TIME_SLOTS.map(slot => (
                    <tr key={slot.id} className="hover:bg-slate-50/50">
                      
                      {/* Time Slot Label */}
                      <td className="p-3 font-semibold text-slate-700 border-r border-slate-200 bg-slate-50/80 sticky left-0">
                        <div className="flex flex-col">
                          <span className="text-base text-indigo-700">{slot.label}</span>
                          <span className="text-[11px] text-slate-400 font-normal">{slot.sub}</span>
                        </div>
                      </td>

                      {/* Room Cells */}
                      {rooms.map(room => {
                        const existing = (schedules[selectedDateKey] || []).find(
                          item => item.slot === slot.id && item.room === room
                        );

                        return (
                          <td 
                            key={room} 
                            className="p-2 border-r border-slate-200 align-top relative group transition hover:bg-indigo-50/30"
                          >
                            {existing ? (
                              <div 
                                onClick={() => openBookingModal(selectedDateKey, slot.id, room, existing)}
                                className={`p-2 rounded-lg border text-xs cursor-pointer shadow-sm flex flex-col justify-between transition hover:scale-[1.02] ${
                                  slot.id === 'morning' ? 'bg-amber-50 border-amber-200 text-amber-900' :
                                  slot.id === 'afternoon' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
                                  'bg-purple-50 border-purple-200 text-purple-900'
                                }`}
                              >
                                <div className="font-bold flex items-center justify-between">
                                  <span>{existing.staff}</span>
                                  <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                                </div>
                                {existing.note && (
                                  <div className="text-[10px] text-slate-500 mt-1 italic truncate">
                                    {existing.note}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => openBookingModal(selectedDateKey, slot.id, room)}
                                className="w-full h-12 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:border-indigo-300 hover:bg-white transition"
                                title="點擊預約"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* List View of filtered schedules for quick reference */}
            <div className="mt-4">
              <h3 className="text-sm font-bold text-slate-600 mb-2">當日班表清單明細 ({filteredDaySchedules.length})</h3>
              {filteredDaySchedules.length === 0 ? (
                <div className="text-center py-6 text-slate-400 border rounded-lg bg-slate-50/50">
                  尚無班表或預約紀錄
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredDaySchedules.map(item => (
                    <div 
                      key={item.id} 
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-10 rounded-full ${
                          item.slot === 'morning' ? 'bg-amber-400' :
                          item.slot === 'afternoon' ? 'bg-emerald-400' : 'bg-purple-400'
                        }`} />
                        <div>
                          <div className="font-bold text-slate-800 text-sm">
                            {item.room} 診間 - {item.staff}
                          </div>
                          <div className="text-xs text-slate-500">
                            時段: {TIME_SLOTS.find(t => t.id === item.slot)?.label} {item.note && `| ${item.note}`}
                          </div>
                        </div>
                      </div>
                      
                      {mode === 'manager' && (
                        <button 
                          onClick={() => handleDeleteSchedule(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-150">
            
            {/* Modal Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <span>{modalData.id ? '編輯排班/預約' : '新增診間排班'}</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveSchedule} className="p-6 space-y-4">
              
              {/* Date & Time Slot */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">日期</label>
                  <input 
                    type="date"
                    value={modalData.dateKey}
                    onChange={(e) => setModalData({ ...modalData, dateKey: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">時段</label>
                  <select
                    value={modalData.slot}
                    onChange={(e) => setModalData({ ...modalData, slot: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {TIME_SLOTS.map(t => (
                      <option key={t.id} value={t.id}>{t.label} ({t.sub})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Room Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">診間號碼</label>
                <select
                  value={modalData.room}
                  onChange={(e) => setModalData({ ...modalData, room: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                >
                  {rooms.map(r => (
                    <option key={r} value={r}>{r} 診間</option>
                  ))}
                </select>
              </div>

              {/* Staff / Doctor Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">預約/排班人員</label>
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="選擇或直接輸入姓名..."
                    value={modalData.staff}
                    onChange={(e) => setModalData({ ...modalData, staff: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    list="staff-options"
                    required
                  />
                  <datalist id="staff-options">
                    {staffList.map(s => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">備註 (可選)</label>
                <input 
                  type="text"
                  placeholder="如：約診、教學門診、支援..."
                  value={modalData.note}
                  onChange={(e) => setModalData({ ...modalData, note: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                {modalData.id ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteSchedule(modalData.id)}
                    className="text-rose-600 hover:text-rose-700 text-sm font-medium flex items-center space-x-1 px-2 py-1 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>刪除</span>
                  </button>
                ) : <div />}

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition"
                  >
                    儲存班表
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
