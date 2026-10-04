import React, { useState, useEffect } from 'react';

// 診間對應清單
const CLINIC_ROOMS = [
  '221', '222', 'M226', 'M227', 'M228', 'M229', 'M241', '239', '243', '汀州', '特需',
  '謝約診(236)', '葉約診(228)', '吳約診(241)', '江約診(229)', '趙約診(226)', '實習門診分組', '當週會診', '備註'
];

// 細分後的時段清單
const TIME_SLOTS = ['上午一', '上午二', '下午一', '下午二', '晚班'];

// 初始預設範例資料
const INITIAL_SCHEDULES = [
  { id: '1', date: '2026-10-01', timeSlot: '上午一', room: '221', doctor: '張耀元', note: '' },
  { id: '2', date: '2026-10-01', timeSlot: '下午一', room: '221', doctor: '陳冠衡', note: '' },
  { id: '3', date: '2026-10-01', timeSlot: '上午一', room: 'M229', doctor: '江合笙', note: '' },
  { id: '4', date: '2026-10-01', timeSlot: '下午二', room: 'M229', doctor: '江合笙', note: '' },
];

export default function App() {
  const [selectedDateStr, setSelectedDateStr] = useState('2026-10-01');
  const [schedules, setSchedules] = useState(() => {
    const saved = localStorage.getItem('clinic_schedules');
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULES;
  });

  const [selectedTimeSlot, setSelectedTimeSlot] = useState('上午一');
  const [selectedRoom, setSelectedRoom] = useState('221');
  const [doctorName, setDoctorName] = useState('');
  const [note, setNote] = useState('');
  const [activeTab, setActiveTab] = useState('matrix');

  // 自動記憶所有曾輸入過的醫師姓名
  const knownDoctors = Array.from(
    new Set(['江合笙', '張耀元', '陳冠衡', ...schedules.map((s) => s.doctor).filter(Boolean)])
  );

  useEffect(() => {
    localStorage.setItem('clinic_schedules', JSON.stringify(schedules));
  }, [schedules]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!doctorName.trim()) return alert('請輸入醫師/人員姓名');

    const existingIndex = schedules.findIndex(
      (s) => s.date === selectedDateStr && s.timeSlot === selectedTimeSlot && s.room === selectedRoom
    );

    const newEntry = {
      id: existingIndex >= 0 ? schedules[existingIndex].id : Date.now().toString(),
      date: selectedDateStr,
      timeSlot: selectedTimeSlot,
      room: selectedRoom,
      doctor: doctorName.trim(),
      note: note.trim(),
    };

    if (existingIndex >= 0) {
      const updated = [...schedules];
      updated[existingIndex] = newEntry;
      setSchedules(updated);
    } else {
      setSchedules([...schedules, newEntry]);
    }

    setDoctorName('');
    setNote('');
    alert('排班已成功儲存！');
    setActiveTab('matrix');
  };

  const handleDelete = (id) => {
    if (confirm('確定要刪除此排班嗎？')) {
      setSchedules(schedules.filter((s) => s.id !== id));
    }
  };

  const getSchedule = (dateStr, slot, room) => {
    return schedules.find((s) => s.date === dateStr && s.timeSlot === slot && s.room === room);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-6">
      {/* 頂部 Header */}
      <header className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-indigo-900 flex items-center gap-2">
            🏥 三總牙髓病科 診間排班與預約系統
          </h1>
          <p className="text-sm text-slate-500 mt-1">線上即時對照班表與診間預約平台</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'matrix' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            日診間對照表
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'calendar' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            + 新增/登記排班
          </button>
        </div>
      </header>

      {/* 主要內容區 */}
      <main className="max-w-7xl mx-auto space-y-6">
        {/* 日診間矩陣對照表 */}
        {activeTab === 'matrix' && (
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <label className="font-bold text-slate-700">選擇日期：</label>
                <input
                  type="date"
                  value={selectedDateStr}
                  onChange={(e) => setSelectedDateStr(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="text-sm text-slate-500">
                目前選取：<span className="font-semibold text-indigo-600">{selectedDateStr}</span>
              </div>
            </div>

            {/* 診間表格 */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-sm text-center border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                    <th className="p-3 border-r border-slate-200 min-w-[90px]">時段</th>
                    {CLINIC_ROOMS.map((room) => (
                      <th key={room} className="p-3 border-r border-slate-200 font-semibold min-w-[100px] bg-slate-50">
                        {room}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map((slot) => (
                    <tr key={slot} className="border-b border-slate-200 hover:bg-slate-50/50">
                      <td className="p-3 font-bold bg-slate-50 border-r border-slate-200 text-slate-700">{slot}</td>
                      {CLINIC_ROOMS.map((room) => {
                        const item = getSchedule(selectedDateStr, slot, room);
                        return (
                          <td
                            key={room}
                            className={`p-2 border-r border-slate-200 transition-colors ${
                              item ? 'bg-indigo-50/60' : ''
                            }`}
                          >
                            {item ? (
                              <div className="flex flex-col items-center justify-center group relative">
                                <span className="font-bold text-indigo-900">{item.doctor}</span>
                                {item.note && <span className="text-xs text-slate-500">{item.note}</span>}
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="mt-1 text-[10px] text-red-500 hover:underline opacity-80 group-hover:opacity-100"
                                >
                                  刪除
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedTimeSlot(slot);
                                  setSelectedRoom(room);
                                  setActiveTab('calendar');
                                }}
                                className="text-xs text-slate-400 hover:text-indigo-600 border border-dashed border-slate-200 hover:border-indigo-300 rounded px-2 py-1 w-full"
                              >
                                + 預約
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
          </section>
        )}

        {/* 新增/登記排班表單 */}
        {activeTab === 'calendar' && (
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-xl mx-auto">
            <h2 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              📝 新增 / 登記診間班表
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">日期</label>
                <input
                  type="date"
                  value={selectedDateStr}
                  onChange={(e) => setSelectedDateStr(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">時段</label>
                  <select
                    value={selectedTimeSlot}
                    onChange={(e) => setSelectedTimeSlot(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {TIME_SLOTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">診間編號</label>
                  <select
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {CLINIC_ROOMS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  看診醫師 / 人員姓名 <span className="text-xs text-slate-400">(可自由輸入或點選)</span>
                </label>
                <input
                  type="text"
                  list="doctor-list"
                  placeholder="請輸入姓名 (例如：江合笙、張耀元)"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
                <datalist id="doctor-list">
                  {knownDoctors.map((doc) => (
                    <option key={doc} value={doc} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">備註 (選填)</label>
                <input
                  type="text"
                  placeholder="例如：(江門診)、約診等"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm"
                >
                  儲存排班
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('matrix')}
                  className="px-4 py-2.5 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50"
                >
                  取消
                </button>
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
