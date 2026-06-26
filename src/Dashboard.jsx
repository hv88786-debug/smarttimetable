import { useState, useEffect, useRef, useCallback } from "react";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_NAME = "Greenfield Public School";
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const PERIODS = [
  { label: "8:00–9:00",   id: "p1" },
  { label: "9:00–10:00",  id: "p2" },
  { label: "BREAK",       id: "break1", isBreak: true, text: "Recess · 10:00 – 10:20" },
  { label: "10:20–11:20", id: "p3" },
  { label: "11:20–12:20", id: "p4" },
  { label: "LUNCH",       id: "lunch",  isBreak: true, text: "Lunch · 12:20 – 1:00"  },
  { label: "1:00–2:00",   id: "p5" },
  { label: "2:00–3:00",   id: "p6" },
];

const SCHEDULABLE_PERIOD_IDS = PERIODS.filter(p => !p.isBreak).map(p => p.id);

const SUBJECT_COLORS = {
  Mathematics:    { bg: "bg-blue-50",   border: "border-l-blue-400",   text: "text-blue-700"   },
  Physics:        { bg: "bg-purple-50", border: "border-l-purple-400", text: "text-purple-700" },
  Chemistry:      { bg: "bg-yellow-50", border: "border-l-yellow-400", text: "text-yellow-700" },
  English:        { bg: "bg-green-50",  border: "border-l-green-400",  text: "text-green-700"  },
  "Computer Sc.": { bg: "bg-orange-50", border: "border-l-orange-400", text: "text-orange-700" },
  History:        { bg: "bg-pink-50",   border: "border-l-pink-400",   text: "text-pink-700"   },
  Biology:        { bg: "bg-teal-50",   border: "border-l-teal-400",   text: "text-teal-700"   },
};

const TEACHER_ROOM = {
  Mathematics:    { tchr: "Mr. Sharma", room: "Room 101" },
  Physics:        { tchr: "Dr. Mehta",  room: "Lab 2"    },
  Chemistry:      { tchr: "Ms. Joshi",  room: "Lab 1"    },
  English:        { tchr: "Ms. Verma",  room: "Room 104" },
  "Computer Sc.": { tchr: "Mr. Patel",  room: "Lab 3"    },
  History:        { tchr: "Ms. Nair",   room: "Room 106" },
  Biology:        { tchr: "Dr. Roy",    room: "Lab 4"    },
};

const CLASSES        = ["X-A", "X-B", "XI-Sci", "XII-Com"];
const ALL_TEACHERS   = [...new Set(Object.values(TEACHER_ROOM).map(t => t.tchr))];
const EXAM_ROOMS     = ["Exam Hall A", "Exam Hall B", "Exam Hall C", "Room 201", "Room 202", "Room 203"];
const EXAM_SUBJECTS  = Object.keys(TEACHER_ROOM);

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-4 h-4">
      <rect x="2" y="2" width="6" height="6" rx="1.2"/><rect x="12" y="2" width="6" height="6" rx="1.2"/>
      <rect x="2" y="12" width="6" height="6" rx="1.2"/><rect x="12" y="12" width="6" height="6" rx="1.2"/>
    </svg>
  )},
  { id: "timetable", label: "Timetable", icon: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-4 h-4">
      <rect x="2" y="3" width="16" height="15" rx="2"/>
      <line x1="7" y1="1" x2="7" y2="5"/><line x1="13" y1="1" x2="13" y2="5"/>
      <line x1="2" y1="8" x2="18" y2="8"/>
    </svg>
  )},
  { id: "teachers", label: "Teachers", icon: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-4 h-4">
      <circle cx="8" cy="6" r="3"/><path d="M2 17c0-3.3 2.7-6 6-6"/>
      <circle cx="15" cy="10" r="2.5"/><path d="M11 17c0-2.2 1.8-4 4-4s4 1.8 4 4"/>
    </svg>
  )},
  { id: "rooms", label: "Rooms", icon: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-4 h-4">
      <path d="M3 18V7l7-4 7 4v11"/><rect x="7.5" y="12" width="5" height="6" rx="1"/>
    </svg>
  )},
  { id: "settings", label: "Settings", icon: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-4 h-4">
      <circle cx="10" cy="10" r="2.5"/>
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4"/>
    </svg>
  )},
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const LS_KEY = "smarttimetable_v3";

function loadState() {
  try { const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : null; }
  catch { return null; }
}
function saveState(s) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch {}
}
function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
function nowDate() {
  return new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

// ── Initial timetable ─────────────────────────────────────────────────────────

function buildInitialTimetable() {
  const T = {
    "X-A": {
      p1:[{subj:"Mathematics",tchr:"Mr. Sharma",room:"Room 101"},{subj:"Physics",tchr:"Dr. Mehta",room:"Lab 2"},{subj:"English",tchr:"Ms. Verma",room:"Room 104"},{subj:"Chemistry",tchr:"Ms. Joshi",room:"Lab 1"},{subj:"Computer Sc.",tchr:"Mr. Patel",room:"Lab 3"}],
      p2:[{subj:"Physics",tchr:"Dr. Mehta",room:"Lab 2"},{subj:"Mathematics",tchr:"Mr. Sharma",room:"Room 101"},{subj:"Chemistry",tchr:"Ms. Joshi",room:"Lab 1"},{subj:"Computer Sc.",tchr:"Mr. Patel",room:"Lab 3"},{subj:"Mathematics",tchr:"Mr. Sharma",room:"Room 101"}],
      p3:[{subj:"Computer Sc.",tchr:"Mr. Patel",room:"Lab 3"},{subj:"Chemistry",tchr:"Ms. Joshi",room:"Lab 1"},{subj:"Mathematics",tchr:"Mr. Sharma",room:"Room 101"},{subj:"English",tchr:"Ms. Verma",room:"Room 104"},{subj:"Physics",tchr:"Dr. Mehta",room:"Lab 2"}],
      p4:[{subj:"English",tchr:"Ms. Verma",room:"Room 104"},{subj:"Computer Sc.",tchr:"Mr. Patel",room:"Lab 3"},{subj:"Physics",tchr:"Dr. Mehta",room:"Lab 2"},{subj:"Mathematics",tchr:"Mr. Sharma",room:"Room 101"},{subj:"Chemistry",tchr:"Ms. Joshi",room:"Lab 1"}],
      p5:[{subj:"Chemistry",tchr:"Ms. Joshi",room:"Lab 1"},{subj:"English",tchr:"Ms. Verma",room:"Room 104"},{subj:"Computer Sc.",tchr:"Mr. Patel",room:"Lab 3"},{subj:"Physics",tchr:"Dr. Mehta",room:"Lab 2"},{subj:"English",tchr:"Ms. Verma",room:"Room 104"}],
      p6:[{subj:"History",tchr:"Ms. Nair",room:"Room 106"},{subj:"Biology",tchr:"Dr. Roy",room:"Lab 4"},{subj:"History",tchr:"Ms. Nair",room:"Room 106"},{subj:"Biology",tchr:"Dr. Roy",room:"Lab 4"},{subj:"History",tchr:"Ms. Nair",room:"Room 106"}],
    },
    "X-B": {
      p1:[{subj:"English",tchr:"Ms. Verma",room:"Room 104"},{subj:"Mathematics",tchr:"Mr. Sharma",room:"Room 101"},{subj:"Physics",tchr:"Dr. Mehta",room:"Lab 2"},{subj:"Computer Sc.",tchr:"Mr. Patel",room:"Lab 3"},{subj:"Chemistry",tchr:"Ms. Joshi",room:"Lab 1"}],
      p2:[{subj:"Chemistry",tchr:"Ms. Joshi",room:"Lab 1"},{subj:"English",tchr:"Ms. Verma",room:"Room 104"},{subj:"Mathematics",tchr:"Mr. Sharma",room:"Room 101"},{subj:"Physics",tchr:"Dr. Mehta",room:"Lab 2"},{subj:"Computer Sc.",tchr:"Mr. Patel",room:"Lab 3"}],
      p3:[{subj:"Physics",tchr:"Dr. Mehta",room:"Lab 2"},{subj:"Computer Sc.",tchr:"Mr. Patel",room:"Lab 3"},{subj:"English",tchr:"Ms. Verma",room:"Room 104"},{subj:"Mathematics",tchr:"Mr. Sharma",room:"Room 101"},{subj:"Chemistry",tchr:"Ms. Joshi",room:"Lab 1"}],
      p4:[{subj:"Mathematics",tchr:"Mr. Sharma",room:"Room 101"},{subj:"Physics",tchr:"Dr. Mehta",room:"Lab 2"},{subj:"Chemistry",tchr:"Ms. Joshi",room:"Lab 1"},{subj:"English",tchr:"Ms. Verma",room:"Room 104"},{subj:"Computer Sc.",tchr:"Mr. Patel",room:"Lab 3"}],
      p5:[{subj:"Computer Sc.",tchr:"Mr. Patel",room:"Lab 3"},{subj:"Chemistry",tchr:"Ms. Joshi",room:"Lab 1"},{subj:"Physics",tchr:"Dr. Mehta",room:"Lab 2"},{subj:"Biology",tchr:"Dr. Roy",room:"Lab 4"},{subj:"Mathematics",tchr:"Mr. Sharma",room:"Room 101"}],
      p6:[{subj:"Biology",tchr:"Dr. Roy",room:"Lab 4"},{subj:"History",tchr:"Ms. Nair",room:"Room 106"},{subj:"Biology",tchr:"Dr. Roy",room:"Lab 4"},{subj:"History",tchr:"Ms. Nair",room:"Room 106"},{subj:"Biology",tchr:"Dr. Roy",room:"Lab 4"}],
    },
  };
  CLASSES.filter(c => !T[c]).forEach(cls => { T[cls] = JSON.parse(JSON.stringify(T["X-A"])); });
  return T;
}

// ── Conflict detector ─────────────────────────────────────────────────────────

function detectConflicts(all) {
  const out = []; let id = 1;
  DAYS.forEach((day, di) => {
    SCHEDULABLE_PERIOD_IDS.forEach(pid => {
      const pLabel = PERIODS.find(p => p.id === pid)?.label || pid;
      const tMap = {}, rMap = {};
      CLASSES.forEach(cls => {
        const cell = (all[cls]?.[pid] || [])[di];
        if (!cell?.subj) return;
        if (tMap[cell.tchr]) out.push({ id: id++, class: cls, period: pLabel, day, teacher: cell.tchr, room: cell.room, note: `${cell.tchr} also assigned to ${tMap[cell.tchr]} at the same time.` });
        else tMap[cell.tchr] = cls;
        if (rMap[cell.room]) out.push({ id: id++, class: cls, period: pLabel, day, teacher: cell.tchr, room: cell.room, note: `${cell.room} double-booked with ${rMap[cell.room]}.` });
        else rMap[cell.room] = cls;
      });
    });
  });
  return out;
}

// ── Timetable generator ───────────────────────────────────────────────────────

function generateTimetable(targetClass, all) {
  const subjects = Object.keys(TEACHER_ROOM);
  const busy = {};
  DAYS.forEach((_, di) => {
    busy[di] = {};
    SCHEDULABLE_PERIOD_IDS.forEach(pid => { busy[di][pid] = { teachers: new Set(), rooms: new Set() }; });
  });
  Object.entries(all).forEach(([cls, g]) => {
    if (cls === targetClass) return;
    SCHEDULABLE_PERIOD_IDS.forEach(pid => {
      (g[pid] || []).forEach((cell, di) => {
        if (cell?.subj) { busy[di][pid].teachers.add(cell.tchr); busy[di][pid].rooms.add(cell.room); }
      });
    });
  });
  const newGrid = {}; SCHEDULABLE_PERIOD_IDS.forEach(pid => { newGrid[pid] = []; });
  const wk = {}; subjects.forEach(s => { wk[s] = 0; });
  let conflictsResolved = 0, subjectsAssigned = 0;
  const roomsUsed = new Set();
  DAYS.forEach((_, di) => {
    const hist = []; const dk = {}; subjects.forEach(s => { dk[s] = 0; });
    SCHEDULABLE_PERIOD_IDS.forEach(pid => {
      const sb = busy[di][pid];
      const ranked = [...subjects].sort((a,b) => wk[a]-wk[b] || dk[a]-dk[b] || Math.random()-.5);
      let chosen = null, needed = false;
      for (const s of ranked) {
        const {tchr,room} = TEACHER_ROOM[s];
        if (sb.teachers.has(tchr)||sb.rooms.has(room)) { needed=true; continue; }
        const l2=hist.slice(-2); if (l2.length===2&&l2[0]===s&&l2[1]===s) continue;
        chosen=s; break;
      }
      if (!chosen) for (const s of ranked) { const {tchr,room}=TEACHER_ROOM[s]; if (!sb.teachers.has(tchr)&&!sb.rooms.has(room)){chosen=s;break;} }
      if (!chosen) chosen=ranked[0];
      if (needed) conflictsResolved++;
      const {tchr,room}=TEACHER_ROOM[chosen];
      newGrid[pid][di]={subj:chosen,tchr,room,conflict:false};
      sb.teachers.add(tchr); sb.rooms.add(room); wk[chosen]++; dk[chosen]++; roomsUsed.add(room); hist.push(chosen); subjectsAssigned++;
    });
  });
  return { newGrid, summary: { conflictsResolved, subjectsAssigned, roomsAllocated: roomsUsed.size } };
}

// ── Emergency helpers ─────────────────────────────────────────────────────────

function findSubstitutesForSlot(dayIdx, periodId, absentTeacher, all) {
  const busy = new Set();
  Object.values(all).forEach(g => { const c=(g[periodId]||[])[dayIdx]; if (c?.tchr) busy.add(c.tchr); });
  return ALL_TEACHERS.filter(t => t!==absentTeacher && !busy.has(t));
}
function findTeacherSlotsOnDay(teacher, dayIdx, all) {
  const slots=[];
  Object.entries(all).forEach(([cls,g]) => {
    SCHEDULABLE_PERIOD_IDS.forEach(pid => { const c=(g[pid]||[])[dayIdx]; if (c?.tchr===teacher) slots.push({cls,periodId:pid}); });
  });
  return slots;
}

// ── Exam generator ────────────────────────────────────────────────────────────

function generateExamSchedule() {
  const sched = {};
  CLASSES.forEach(cls => { sched[cls]={}; SCHEDULABLE_PERIOD_IDS.forEach(pid => { sched[cls][pid]=Array(5).fill(null); }); });
  const usedByClass = {}; CLASSES.forEach(c => { usedByClass[c]=new Set(); });
  SCHEDULABLE_PERIOD_IDS.forEach((pid, pIdx) => {
    const usedR=new Set(), usedI=new Set(), usedC=new Set();
    CLASSES.forEach(cls => {
      if (usedC.has(cls)) return;
      const avail=EXAM_SUBJECTS.filter(s=>!usedByClass[cls].has(s));
      if (!avail.length) return;
      const subj=avail[(CLASSES.indexOf(cls)+pIdx)%avail.length];
      const inv=TEACHER_ROOM[subj].tchr;
      if (usedI.has(inv)) return;
      const room=EXAM_ROOMS[(CLASSES.indexOf(cls)+pIdx)%EXAM_ROOMS.length];
      if (usedR.has(room)) return;
      const dayIdx=(CLASSES.indexOf(cls)+pIdx*2)%5;
      sched[cls][pid][dayIdx]={subj:subj+" Exam",room,time:pIdx<2?"9:00 AM – 12:00 PM":pIdx<4?"1:00 PM – 4:00 PM":"2:00 PM – 5:00 PM",invigilator:inv};
      usedR.add(room); usedI.add(inv); usedC.add(cls); usedByClass[cls].add(subj);
    });
  });
  return sched;
}

// ── PDF / Print utilities ─────────────────────────────────────────────────────

function buildTimetableHTML(cls, grid, dateStr) {
  const periodRows = PERIODS.map(p => {
    if (p.isBreak) return `<tr><td colspan="6" style="text-align:center;font-style:italic;color:#94a3b8;padding:4px;background:#f8fafc;font-size:11px;">— ${p.text} —</td></tr>`;
    const cells = DAYS.map((_, di) => {
      const cell = (grid[p.id] || [])[di];
      if (!cell) return `<td style="padding:6px 8px;border:1px solid #e2e8f0;font-size:11px;color:#94a3b8;">—</td>`;
      const badge = cell.substituted ? `<span style="display:inline-block;font-size:9px;background:#fef3c7;color:#d97706;border:1px solid #fcd34d;border-radius:3px;padding:1px 4px;margin-top:2px;">🔁 Sub</span>` : "";
      return `<td style="padding:6px 8px;border:1px solid #e2e8f0;font-size:11px;vertical-align:top;"><strong style="font-size:11.5px;color:#1e293b;">${cell.subj}</strong><br/><span style="color:#64748b;font-size:10.5px;">${cell.tchr}</span><br/><span style="color:#94a3b8;font-size:10px;">${cell.room}</span>${badge}</td>`;
    }).join("");
    return `<tr><td style="padding:6px 8px;border:1px solid #e2e8f0;background:#f8fafc;font-size:10.5px;color:#94a3b8;white-space:nowrap;text-align:center;">${p.label}</td>${cells}</tr>`;
  }).join("");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Timetable – ${cls}</title>
<style>
  body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:24px;background:#fff;color:#1e293b;}
  .header{border-bottom:2px solid #0d9488;padding-bottom:12px;margin-bottom:18px;}
  .school{font-size:18px;font-weight:700;color:#0d9488;}
  .meta{font-size:12px;color:#64748b;margin-top:3px;}
  .badge{display:inline-block;background:#f0fdfa;border:1px solid #99f6e4;color:#0d9488;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:600;margin-right:8px;}
  table{width:100%;border-collapse:collapse;}
  th{background:#f0fdfa;color:#0d9488;font-size:11px;padding:7px 8px;border:1px solid #e2e8f0;text-align:center;}
  th:first-child{background:#f8fafc;color:#94a3b8;}
  @media print{body{padding:12px;} .no-print{display:none;}}
</style></head><body>
<div class="header">
  <div class="school">${SCHOOL_NAME}</div>
  <div class="meta"><span class="badge">${cls}</span>Weekly Timetable &nbsp;·&nbsp; Generated: ${dateStr}</div>
</div>
<table>
  <thead><tr><th>Time</th>${DAYS.map(d=>`<th>${d}</th>`).join("")}</tr></thead>
  <tbody>${periodRows}</tbody>
</table>
<div style="margin-top:20px;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px;">
  SmartTimetable &nbsp;·&nbsp; 30 Days · 30 SIH Solutions &nbsp;·&nbsp; Day 10 &nbsp;·&nbsp; ${SCHOOL_NAME}
</div>
</body></html>`;
}

function buildExamHTML(cls, examGrid, dateStr) {
  const periodRows = PERIODS.map(p => {
    if (p.isBreak) return `<tr><td colspan="6" style="text-align:center;font-style:italic;color:#94a3b8;padding:4px;background:#f8fafc;font-size:11px;">— ${p.text} —</td></tr>`;
    const cells = DAYS.map((_, di) => {
      const exam = (examGrid[p.id] || [])[di];
      if (!exam) return `<td style="padding:6px 8px;border:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center;">—</td>`;
      return `<td style="padding:6px 8px;border:1px solid #e2e8f0;font-size:11px;vertical-align:top;background:#f0fdfa;"><strong style="font-size:11.5px;color:#0f766e;">${exam.subj}</strong><br/><span style="color:#64748b;font-size:10.5px;">${exam.room} · ${exam.time}</span><br/><span style="color:#94a3b8;font-size:10px;">Invigilator: ${exam.invigilator}</span></td>`;
    }).join("");
    return `<tr><td style="padding:6px 8px;border:1px solid #e2e8f0;background:#f8fafc;font-size:10.5px;color:#94a3b8;white-space:nowrap;text-align:center;">${p.label}</td>${cells}</tr>`;
  }).join("");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Exam Schedule – ${cls}</title>
<style>
  body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:24px;background:#fff;color:#1e293b;}
  .header{border-bottom:2px solid #0d9488;padding-bottom:12px;margin-bottom:18px;}
  .school{font-size:18px;font-weight:700;color:#0d9488;}
  .meta{font-size:12px;color:#64748b;margin-top:3px;}
  .badge{display:inline-block;background:#f0fdfa;border:1px solid #99f6e4;color:#0d9488;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:600;margin-right:8px;}
  table{width:100%;border-collapse:collapse;}
  th{background:#f0fdfa;color:#0d9488;font-size:11px;padding:7px 8px;border:1px solid #e2e8f0;text-align:center;}
  th:first-child{background:#f8fafc;color:#94a3b8;}
  @media print{body{padding:12px;}}
</style></head><body>
<div class="header">
  <div class="school">${SCHOOL_NAME}</div>
  <div class="meta"><span class="badge">${cls}</span>Examination Schedule &nbsp;·&nbsp; Generated: ${dateStr}</div>
</div>
<table>
  <thead><tr><th>Time Slot</th>${DAYS.map(d=>`<th>${d}</th>`).join("")}</tr></thead>
  <tbody>${periodRows}</tbody>
</table>
<div style="margin-top:20px;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px;">
  SmartTimetable &nbsp;·&nbsp; Examination Management &nbsp;·&nbsp; ${SCHOOL_NAME}
</div>
</body></html>`;
}

function buildActivityReportHTML(log, dateStr) {
  const emergencyCount = log.filter(a => a.msg.includes("⚠") || a.msg.includes("Emergency")).length;
  const examCount      = log.filter(a => a.msg.includes("📝") || a.msg.includes("📋")).length;
  const editCount      = log.filter(a => a.msg.includes("✏️")).length;
  const genCount       = log.filter(a => a.msg.includes("⚡")).length;

  const rows = log.map((a, i) => {
    const isEmergency = a.msg.includes("⚠") || a.msg.includes("Emergency");
    const isExam = a.msg.includes("📝") || a.msg.includes("📋");
    const color = isEmergency ? "#d97706" : isExam ? "#3b82f6" : "#0d9488";
    const categoryLabel = isEmergency ? "Emergency" : isExam ? "Exam" : "System";
    return `<tr style="background:${i%2===0?"#fff":"#f8fafc"}">
      <td style="padding:7px 12px;border:1px solid #e2e8f0;font-size:11px;color:#94a3b8;white-space:nowrap;">${a.time}</td>
      <td style="padding:7px 12px;border:1px solid #e2e8f0;font-size:10px;white-space:nowrap;">
        <span style="display:inline-block;background:${color}18;color:${color};border:1px solid ${color}40;border-radius:10px;padding:1px 7px;font-weight:600;">${categoryLabel}</span>
      </td>
      <td style="padding:7px 12px;border:1px solid #e2e8f0;font-size:11.5px;"><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${color};margin-right:7px;vertical-align:middle;"></span>${a.msg}</td>
    </tr>`;
  }).join("");

  const summaryCards = [
    { label:"Total Entries", val: log.length, color:"#0d9488" },
    { label:"Auto-Generates", val: genCount, color:"#6366f1" },
    { label:"Manual Edits",  val: editCount, color:"#3b82f6" },
    { label:"Emergencies",   val: emergencyCount, color:"#d97706" },
    { label:"Exam Events",   val: examCount, color:"#8b5cf6" },
  ].map(c => `<div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;min-width:100px;text-align:center;">
    <div style="font-size:22px;font-weight:800;color:${c.color}">${c.val}</div>
    <div style="font-size:10.5px;color:#94a3b8;margin-top:3px;">${c.label}</div>
  </div>`).join("");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Activity Report — ${dateStr}</title>
<style>
  body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:24px;background:#fff;color:#1e293b;}
  .header{border-bottom:2px solid #0d9488;padding-bottom:12px;margin-bottom:18px;}
  .school{font-size:18px;font-weight:700;color:#0d9488;}
  .meta{font-size:12px;color:#64748b;margin-top:3px;}
  .summary{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:18px;}
  table{width:100%;border-collapse:collapse;}
  th{background:#f0fdfa;color:#0d9488;font-size:11px;padding:7px 12px;border:1px solid #e2e8f0;text-align:left;}
  @media print{body{padding:12px;} #pdf-tip{display:none;}}
</style></head><body>
<div class="header">
  <div class="school">${SCHOOL_NAME}</div>
  <div class="meta">System Activity Report &nbsp;·&nbsp; Generated: ${dateStr} &nbsp;·&nbsp; ${log.length} total entries</div>
</div>
<div class="summary">${summaryCards}</div>
<table>
  <thead><tr><th style="width:110px;">Time</th><th style="width:90px;">Category</th><th>Activity</th></tr></thead>
  <tbody>${rows.length ? rows : '<tr><td colspan="3" style="text-align:center;color:#94a3b8;padding:16px;font-size:12px;">No activity logged.</td></tr>'}</tbody>
</table>
<div style="margin-top:20px;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px;">
  SmartTimetable &nbsp;·&nbsp; Activity Log Export &nbsp;·&nbsp; ${SCHOOL_NAME} &nbsp;·&nbsp; SIH 2024
</div>
</body></html>`;
}

/**
 * Opens a new window with the given HTML.
 * pdfMode = true  → injects a "Save as PDF" tip banner, triggers print dialog automatically
 *                   (browser "Save as PDF" destination produces a PDF file)
 * pdfMode = false → just opens the window for printing; triggers print dialog automatically
 */
function printHTML(html, pdfMode = false) {
  try {
    const w = window.open("", "_blank", "width=960,height=720");
    if (!w) {
      alert("Pop-ups are blocked. Please allow pop-ups for this site to export or print.");
      return false;
    }
    // Inject a dismissable tip banner when in PDF-export mode
    const pdfBanner = pdfMode
      ? `<div id="pdf-tip" style="
            position:fixed;top:0;left:0;right:0;background:#0d9488;color:#fff;
            font-family:'Segoe UI',Arial,sans-serif;font-size:12px;font-weight:600;
            padding:8px 16px;display:flex;align-items:center;justify-content:between;
            gap:12px;z-index:9999;box-shadow:0 2px 8px rgba(0,0,0,.15);">
            <span style="flex:1">💡 To save as PDF: in the print dialog, set <strong>Destination → Save as PDF</strong>, then click Save.</span>
            <button onclick="document.getElementById('pdf-tip').style.display='none'"
              style="background:rgba(255,255,255,.25);border:none;color:#fff;cursor:pointer;
                     border-radius:4px;padding:2px 10px;font-size:11px;font-weight:700;">✕ Close tip</button>
          </div>
          <div style="height:40px"></div>`
      : "";

    // Insert the banner right after <body>
    const htmlWithBanner = html.replace("<body>", `<body>${pdfBanner}`);

    w.document.open();
    w.document.write(htmlWithBanner);
    w.document.close();

    // Trigger print dialog — use a small delay so document finishes rendering
    setTimeout(() => {
      try { w.focus(); w.print(); } catch (e) { /* user may have closed the window */ }
    }, pdfMode ? 800 : 400);

    return true;
  } catch (err) {
    alert("Export failed. Please try again or check your browser settings.");
    return false;
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SubjectCell({ cell, onEdit }) {
  if (!cell) return <div className="min-h-[58px]" />;
  const colors = SUBJECT_COLORS[cell.subj] || SUBJECT_COLORS["History"];
  return (
    <div onClick={() => onEdit(cell)}
      className={`min-h-[58px] px-2 py-1.5 border-l-[3px] cursor-pointer flex flex-col justify-center gap-0.5
        ${colors.bg} ${colors.border} hover:brightness-95 transition-all`}>
      <div className="font-semibold text-[11.5px] text-slate-800 leading-tight">{cell.subj}</div>
      <div className="text-[10.5px] text-slate-500">{cell.tchr}</div>
      <div className="text-[10px] text-slate-400">{cell.room}</div>
      {cell.conflict && <span className="mt-0.5 inline-block text-[9px] font-semibold bg-red-50 text-red-600 border border-red-200 rounded px-1 py-px w-fit">⚠ Conflict</span>}
      {cell.substituted && <span className="mt-0.5 inline-block text-[9px] font-semibold bg-amber-50 text-amber-600 border border-amber-200 rounded px-1 py-px w-fit">🔁 Substitute</span>}
    </div>
  );
}

function ExamCell({ exam }) {
  if (!exam) return <div className="min-h-[58px] flex items-center justify-center text-[10px] text-slate-300">—</div>;
  return (
    <div className="min-h-[58px] px-2 py-1.5 border-l-[3px] border-l-teal-400 bg-teal-50/60 flex flex-col justify-center gap-0.5">
      <div className="font-semibold text-[11.5px] text-teal-800 leading-tight">{exam.subj}</div>
      <div className="text-[10.5px] text-slate-500">{exam.room} · {exam.time}</div>
      <div className="text-[10px] text-slate-400">Invigilator: {exam.invigilator}</div>
    </div>
  );
}

function EditModal({ cell, onSave, onClose }) {
  const [subj, setSubj] = useState(cell.subj);
  const [tchr, setTchr] = useState(cell.tchr);
  const [room, setRoom] = useState(cell.room);
  const ic = "w-full border border-slate-200 rounded-md px-3 py-1.5 text-[13px] text-slate-700 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-100 bg-white";
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-80 p-5" onClick={e => e.stopPropagation()}>
        <div className="text-[14px] font-bold text-slate-800 mb-0.5">Edit Period</div>
        <div className="text-[12px] text-slate-400 mb-4">Update subject, teacher, and room.</div>
        <div className="space-y-3">
          <div><label className="block text-[11.5px] font-medium text-slate-600 mb-1">Subject</label>
            <select className={ic} value={subj} onChange={e=>setSubj(e.target.value)}>{Object.keys(SUBJECT_COLORS).map(s=><option key={s}>{s}</option>)}</select></div>
          <div><label className="block text-[11.5px] font-medium text-slate-600 mb-1">Teacher</label>
            <select className={ic} value={tchr} onChange={e=>setTchr(e.target.value)}>{ALL_TEACHERS.map(t=><option key={t}>{t}</option>)}</select></div>
          <div><label className="block text-[11.5px] font-medium text-slate-600 mb-1">Room / Lab</label>
            <input className={ic} value={room} onChange={e=>setRoom(e.target.value)}/></div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-3 py-1.5 text-[12.5px] font-medium text-slate-600 border border-slate-200 rounded-md hover:border-slate-300 bg-white">Cancel</button>
          <button onClick={()=>onSave({subj,tchr,room})} className="px-3 py-1.5 text-[12.5px] font-semibold text-white bg-teal-600 rounded-md hover:bg-teal-700">Save Changes</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel, confirmLabel="Confirm", danger=false }) {
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-xl w-80 p-5" onClick={e=>e.stopPropagation()}>
        <div className="text-[14px] font-bold text-slate-800 mb-2">Confirm Action</div>
        <div className="text-[13px] text-slate-500 mb-5">{message}</div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 text-[12.5px] font-medium text-slate-600 border border-slate-200 rounded-md hover:border-slate-300 bg-white">Cancel</button>
          <button onClick={onConfirm} className={`px-3 py-1.5 text-[12.5px] font-semibold text-white rounded-md ${danger?"bg-red-500 hover:bg-red-600":"bg-teal-600 hover:bg-teal-700"}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function EmergencyModal({ timetable, onClose, onAssign }) {
  const [day, setDay] = useState(DAYS[0]);
  const [teacher, setTeacher] = useState(ALL_TEACHERS[0]);
  const [checkedPeriods, setCheckedPeriods] = useState({});
  const [chosenSub, setChosenSub] = useState({});
  const [searched, setSearched] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const dayIdx = DAYS.indexOf(day);
  const pLabel = pid => PERIODS.find(p=>p.id===pid)?.label || pid;
  const affectedSlots = searched ? findTeacherSlotsOnDay(teacher, dayIdx, timetable) : [];
  const affPids = [...new Set(affectedSlots.map(s=>s.periodId))];
  const ic = "w-full border border-slate-200 rounded-md px-3 py-1.5 text-[13px] text-slate-700 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-100 bg-white";

  function handleSearch() {
    setSearched(true);
    const slots = findTeacherSlotsOnDay(teacher, dayIdx, timetable);
    const pids = [...new Set(slots.map(s=>s.periodId))];
    const nc={}, ns={};
    pids.forEach(pid=>{nc[pid]=true; const subs=findSubstitutesForSlot(dayIdx,pid,teacher,timetable); if(subs[0]) ns[pid]=subs[0];});
    setCheckedPeriods(nc); setChosenSub(ns);
  }
  function handleAssign() {
    const pts = affPids.filter(pid=>checkedPeriods[pid]&&chosenSub[pid]);
    setAssigning(true);
    setTimeout(()=>{ onAssign({teacher,day,dayIdx,periodsToAssign:pts,chosenSub}); setAssigning(false); },600);
  }
  const anySelected = affPids.some(pid=>checkedPeriods[pid]&&chosenSub[pid]);
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-[26rem] max-h-[85vh] overflow-y-auto p-5" onClick={e=>e.stopPropagation()}>
        <div className="flex items-start gap-2.5 mb-4">
          <span className="w-7 h-7 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center text-[14px] flex-shrink-0 animate-pulse">⚠</span>
          <div><div className="text-[14px] font-bold text-slate-800">Emergency Mode</div>
            <div className="text-[12px] text-slate-400">Mark a teacher absent and assign substitutes instantly.</div></div>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[11.5px] font-medium text-slate-600 mb-1">Absent Teacher</label>
              <select className={ic} value={teacher} onChange={e=>{setTeacher(e.target.value);setSearched(false);}}>
                {ALL_TEACHERS.map(t=><option key={t}>{t}</option>)}</select></div>
            <div><label className="block text-[11.5px] font-medium text-slate-600 mb-1">Day</label>
              <select className={ic} value={day} onChange={e=>{setDay(e.target.value);setSearched(false);}}>
                {DAYS.map(d=><option key={d}>{d}</option>)}</select></div>
          </div>
          <button onClick={handleSearch} className="w-full px-3 py-1.5 text-[12.5px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 transition-colors">Find Affected Periods</button>
          {searched && (affPids.length===0
            ? <div className="text-[12px] text-slate-400 px-1 py-2 flex items-center gap-2"><span className="text-emerald-500">✓</span>{teacher} has no classes on {day}.</div>
            : <div className="border border-slate-200 rounded-md divide-y divide-slate-100 animate-[fadeIn_.2s_ease]">
                <div className="px-3 py-2 bg-amber-50/60 text-[12px] font-semibold text-amber-700">⚠ {teacher} absent on {day} — {affPids.length} period(s) affected.</div>
                {affPids.map(pid=>{
                  const subs=findSubstitutesForSlot(dayIdx,pid,teacher,timetable);
                  const cls=affectedSlots.filter(s=>s.periodId===pid).map(s=>s.cls).join(", ");
                  return <div key={pid} className="px-3 py-2.5">
                    <label className="flex items-center gap-2 text-[12px] font-medium text-slate-700 mb-0.5 cursor-pointer">
                      <input type="checkbox" checked={!!checkedPeriods[pid]} onChange={e=>setCheckedPeriods(p=>({...p,[pid]:e.target.checked}))} className="accent-teal-600"/>
                      {pLabel(pid)} <span className="text-[10.5px] text-slate-400 font-normal">— {cls}</span>
                    </label>
                    {subs.length===0
                      ? <div className="text-[11px] text-red-500 pl-5">⚠ No free substitute available.</div>
                      : <div className="pl-5 flex flex-wrap gap-2 mt-1">
                          {subs.slice(0,3).map(s=>(
                            <label key={s} className={`flex items-center gap-1 text-[11.5px] px-2 py-1 rounded-md border cursor-pointer transition-colors ${chosenSub[pid]===s?"border-teal-400 bg-teal-50 text-teal-700 font-semibold":"border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                              <input type="radio" name={`sub-${pid}`} className="accent-teal-600" checked={chosenSub[pid]===s} onChange={()=>setChosenSub(p=>({...p,[pid]:s}))}/>✓ {s}
                            </label>
                          ))}
                        </div>}
                  </div>;
                })}
              </div>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-3 py-1.5 text-[12.5px] font-medium text-slate-600 border border-slate-200 rounded-md hover:border-slate-300 bg-white">Cancel</button>
          <button onClick={handleAssign} disabled={!anySelected||assigning}
            className={`px-3 py-1.5 text-[12.5px] font-semibold rounded-md transition-colors flex items-center gap-1.5 ${anySelected&&!assigning?"text-white bg-teal-600 hover:bg-teal-700":"text-slate-400 bg-slate-100 cursor-not-allowed"}`}>
            {assigning?<><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25"/><path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>Assigning…</>:"Assign Substitute"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Export dropdown component — shown on the "Export PDF" button
function ExportMenu({ activeClass, timetable, examSchedule, examMode, activityLog, onClose, showToast }) {
  const date = nowDate();
  const btnCls = "w-full text-left px-4 py-2.5 text-[12.5px] hover:bg-slate-50 flex items-center gap-2.5 transition-colors";
  const grid = timetable[activeClass] || {};
  const examGrid = examSchedule?.[activeClass] || {};

  function doExport(buildFn, ...args) {
    const html = buildFn(...args);
    const ok = printHTML(html, true);
    if (ok) showToast("PDF export opened — choose 'Save as PDF' in the print dialog.", "info");
    onClose();
  }
  function doPrint(buildFn, ...args) {
    const html = buildFn(...args);
    const ok = printHTML(html, false);
    if (ok) showToast("Print dialog opened.");
    onClose();
  }

  const hasActivity = activityLog.length > 0;
  const hasExam = !!examSchedule;

  return (
    <div className="absolute right-0 top-10 w-60 bg-white border border-slate-200 rounded-lg shadow-lg z-40 overflow-hidden animate-[fadeIn_.15s_ease]" onClick={e=>e.stopPropagation()}>
      <div className="px-4 py-2 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Timetable — {activeClass}</div>

      <button className={btnCls} onClick={()=>doPrint(buildTimetableHTML, activeClass, grid, date)}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-teal-600"><path d="M4 4V2h8v2"/><rect x="2" y="5" width="12" height="7" rx="1"/><path d="M5 12v2h6v-2"/><circle cx="12" cy="8.5" r="0.8" fill="currentColor"/></svg>
        <span className="text-slate-700">Print Timetable</span>
      </button>

      <button className={btnCls} onClick={()=>doExport(buildTimetableHTML, activeClass, grid, date)}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-teal-600"><path d="M3 12l2-2 2 2 2-2 2 2"/><rect x="2" y="2" width="12" height="12" rx="1.5"/><path d="M5 6h6M5 8.5h4"/></svg>
        <span className="text-slate-700">Export Timetable as PDF</span>
      </button>

      <div className="border-t border-slate-100 mt-0.5"/>
      <div className="px-4 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Exam Schedule</div>

      {hasExam ? (
        <>
          <button className={btnCls} onClick={()=>doPrint(buildExamHTML, activeClass, examGrid, date)}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-blue-500"><path d="M4 4V2h8v2"/><rect x="2" y="5" width="12" height="7" rx="1"/><path d="M5 12v2h6v-2"/><circle cx="12" cy="8.5" r="0.8" fill="currentColor"/></svg>
            <span className="text-slate-700">Print Exam Schedule</span>
          </button>
          <button className={btnCls} onClick={()=>doExport(buildExamHTML, activeClass, examGrid, date)}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-blue-500"><path d="M3 12l2-2 2 2 2-2 2 2"/><rect x="2" y="2" width="12" height="12" rx="1.5"/><path d="M5 6h6M5 8.5h4"/></svg>
            <span className="text-slate-700">Export Exam Schedule as PDF</span>
          </button>
        </>
      ) : (
        <div className="px-4 py-2 text-[11.5px] text-slate-400 italic">Generate exam schedule first.</div>
      )}

      <div className="border-t border-slate-100 mt-0.5"/>
      <div className="px-4 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Activity Report</div>

      {hasActivity ? (
        <>
          <button className={btnCls} onClick={()=>doPrint(buildActivityReportHTML, activityLog, date)}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-amber-500"><rect x="2" y="2" width="12" height="12" rx="1.5"/><path d="M5 5.5h6M5 8h6M5 10.5h3"/></svg>
            <span className="text-slate-700">Print Activity Report</span>
          </button>
          <button className={btnCls} onClick={()=>doExport(buildActivityReportHTML, activityLog, date)}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-amber-500"><path d="M8 2v8m-3-3l3 3 3-3"/><path d="M3 13h10" strokeLinecap="round"/></svg>
            <span className="text-slate-700">Export Activity Report as PDF</span>
          </button>
        </>
      ) : (
        <div className="px-4 py-2 text-[11.5px] text-slate-400 italic">No activity logged yet.</div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [activeNav,  setActiveNav]  = useState("dashboard");
  const [activeClass,setActiveClass]= useState("X-A");
  const [search,     setSearch]     = useState("");

  // ── Persisted state ───────────────────────────────────────────────────────
  const [timetable, setTimetable] = useState(() => loadState()?.timetable || buildInitialTimetable());
  const [examSchedule, setExamSchedule] = useState(() => loadState()?.examSchedule || null);
  const [activityLog, setActivityLog] = useState(() => loadState()?.activityLog || [
    { time: "10 min ago", msg: "Timetable for X-A updated by Admin" },
    { time: "42 min ago", msg: "Mr. Sharma marked unavailable on Friday" },
    { time: "1 hr ago",   msg: "New teacher Dr. Roy added to Biology" },
    { time: "2 hrs ago",  msg: "Room Lab 2 reserved for practical exam" },
    { time: "Yesterday",  msg: "XII-Com timetable published" },
  ]);
  const [notifications, setNotifications] = useState(() => loadState()?.notifications || []);

  // ── Undo stack: each entry = { label, timetable, examSchedule, activityLog } ─
  const [undoStack, setUndoStack] = useState([]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [editTarget,     setEditTarget]     = useState(null);
  const [notifOpen,      setNotifOpen]      = useState(false);
  const [exportOpen,     setExportOpen]     = useState(false);
  const [conflicts,      setConflicts]      = useState(() => detectConflicts(loadState()?.timetable || buildInitialTimetable()));
  const [generating,     setGenerating]     = useState(false);
  const [genSummary,     setGenSummary]     = useState(null);
  const [examMode,       setExamMode]       = useState(false);
  const [generatingExam, setGeneratingExam] = useState(false);
  const [examSummary,    setExamSummary]    = useState(null);
  const [emergencyOpen,  setEmergencyOpen]  = useState(false);
  const [emergencyNotice,setEmergencyNotice]= useState(null);
  const [toast,          setToast]          = useState(null);
  const [confirmDialog,  setConfirmDialog]  = useState(null);
  const notifRef  = useRef(null);
  const exportRef = useRef(null);
  const userRef   = useRef(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const grid     = timetable[activeClass] || {};
  const examGrid = examSchedule?.[activeClass] || {};

  // ── Persist ───────────────────────────────────────────────────────────────
  useEffect(() => { saveState({ timetable, examSchedule, activityLog, notifications }); },
    [timetable, examSchedule, activityLog, notifications]);

  // ── Close dropdowns on outside click ─────────────────────────────────────
  useEffect(() => {
    const h = (e) => {
      if (notifRef.current  && !notifRef.current.contains(e.target))  setNotifOpen(false);
      if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false);
      if (userRef.current   && !userRef.current.contains(e.target))   setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── Session guard ─────────────────────────────────────────────────────────
  // This dashboard is a separate page from the landing page. If someone lands
  // here directly (or refreshes) without a demo session, send them back to
  // the landing page to sign in first.
  useEffect(() => {
    try {
      if (!localStorage.getItem("st_session_harish")) {
        window.location.replace("./index.html");
      }
    } catch {}
  }, []);

  function handleSignOut() {
    try { localStorage.removeItem("st_session_harish"); } catch {}
    // Logging out always returns to the landing page.
    window.location.href = "./index.html";
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const showToast = useCallback((msg, type="success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  }, []);

  const addNotification = useCallback((msg, type="info") => {
    setNotifications(prev => [{ id: Date.now()+Math.random(), msg, type, time: nowTime() }, ...prev]);
  }, []);

  const addActivity = useCallback((msg) => {
    setActivityLog(prev => [{ time: nowTime(), msg }, ...prev]);
  }, []);

  /** Push a snapshot to the undo stack before a destructive operation */
  function pushUndo(label) {
    setUndoStack(prev => [
      { label, timetable: JSON.parse(JSON.stringify(timetable)), examSchedule: examSchedule ? JSON.parse(JSON.stringify(examSchedule)) : null, activityLog: [...activityLog] },
      ...prev.slice(0, 9), // keep max 10
    ]);
  }

  function handleUndo() {
    setUndoStack(prev => {
      if (!prev.length) return prev;
      const [top, ...rest] = prev;
      setTimetable(top.timetable);
      setExamSchedule(top.examSchedule);
      setActivityLog(top.activityLog);
      setConflicts(detectConflicts(top.timetable));
      setGenSummary(null);
      setExamSummary(null);
      showToast(`Last action undone: "${top.label}".`, "info");
      addNotification(`↩ Last action undone: ${top.label}.`, "info");
      return rest;
    });
  }

  function recalcConflicts(tt) {
    const d = detectConflicts(tt); setConflicts(d); return d;
  }

  // ── Cell edit ─────────────────────────────────────────────────────────────
  function handleCellClick(periodId, dayIdx, cell) { if (!examMode) setEditTarget({ periodId, dayIdx, cell }); }

  function handleSave({ subj, tchr, room }) {
    const { periodId, dayIdx } = editTarget;
    setTimetable(prev => {
      const next = { ...prev };
      const row = [...(next[activeClass][periodId] || [])];
      row[dayIdx] = { subj, tchr, room, conflict: false };
      next[activeClass] = { ...next[activeClass], [periodId]: row };
      const d = recalcConflicts(next);
      if (d.length) {
        addNotification(`⚠ ${d.length} conflict(s) detected after edit.`, "conflict");
        showToast(`Period updated — ${d.length} scheduling conflict(s) detected.`, "error");
      } else {
        showToast("Period updated successfully.");
      }
      return next;
    });
    setEditTarget(null);
    addActivity(`✏️ ${activeClass} — ${PERIODS.find(p=>p.id===editTarget.periodId)?.label} updated: ${subj} with ${tchr}`);
  }

  function dismissConflict(id)     { setConflicts(c => c.filter(x=>x.id!==id)); }
  function dismissNotification(id) { setNotifications(p => p.filter(n=>n.id!==id)); }

  // ── Auto-generate ─────────────────────────────────────────────────────────
  function handleAutoGenerate() {
    setConfirmDialog({
      message: `Regenerate the full timetable for ${activeClass}? All existing entries for this class will be replaced.`,
      onConfirm: () => {
        setConfirmDialog(null);
        pushUndo(`Timetable regenerated for ${activeClass}`);
        setGenerating(true); setGenSummary(null);
        setTimeout(() => {
          const { newGrid, summary } = generateTimetable(activeClass, timetable);
          setTimetable(prev => {
            const next = { ...prev, [activeClass]: newGrid };
            const d = recalcConflicts(next);
            addNotification(d.length===0 ? "✅ Timetable generated — no conflicts." : `⚠ Timetable generated — ${d.length} conflict(s) found.`, d.length===0?"success":"conflict");
            return next;
          });
          setGenSummary(summary); setGenerating(false);
          addActivity(`⚡ Auto-generated timetable for ${activeClass} — ${summary.subjectsAssigned} slots filled, ${summary.conflictsResolved} conflicts resolved.`);
          addNotification(`📅 Timetable generated for ${activeClass}.`, "success");
          showToast(`Timetable for ${activeClass} generated successfully.`);
        }, 900);
      },
    });
  }

  // ── Emergency ─────────────────────────────────────────────────────────────
  function handleAssignSubstitute({ teacher, day, dayIdx, periodsToAssign, chosenSub }) {
    pushUndo(`Emergency substitution — ${teacher} absent on ${day}`);
    setTimetable(prev => {
      const next = {};
      Object.entries(prev).forEach(([cls, g]) => {
        const ng = {};
        Object.entries(g).forEach(([pid, row]) => {
          ng[pid] = periodsToAssign.includes(pid)
            ? row.map(cell => cell?.tchr===teacher ? {...cell,tchr:chosenSub[pid],conflict:false,substituted:true} : cell)
            : row;
        });
        next[cls] = ng;
      });
      recalcConflicts(next); return next;
    });
    const subNames     = [...new Set(periodsToAssign.map(pid=>chosenSub[pid]))].join(", ");
    const periodLabels = periodsToAssign.map(pid=>PERIODS.find(p=>p.id===pid)?.label).join(", ");
    setEmergencyNotice(`${teacher} marked absent on ${day} — ${subNames} substituted (${periodLabels}).`);
    setEmergencyOpen(false);
    addActivity(`⚠ Emergency: ${teacher} absent on ${day}. Substitute(s) ${subNames} assigned for ${periodLabels}.`);
    addNotification(`🔁 Substitute Assigned: ${subNames} covering ${teacher} on ${day}.`, "emergency");
    addNotification(`❌ Teacher Unavailable: ${teacher} marked absent on ${day}.`, "emergency");
    showToast(`Substitute assigned for ${periodsToAssign.length} period(s).`);
  }

  // ── Exam mode ─────────────────────────────────────────────────────────────
  function handleToggleExamMode() {
    if (examMode) {
      setExamMode(false);
      addActivity(`📋 Exam Mode disabled — regular timetable restored for ${activeClass}.`);
      showToast("Exam Mode disabled. Regular timetable restored.", "info");
    } else {
      if (!examSchedule) { handleGenerateExamSchedule(true); }
      else { setExamMode(true); addActivity(`📝 Exam Mode enabled for ${activeClass}.`); showToast("Exam Mode enabled."); }
    }
  }

  function handleGenerateExamSchedule(alsoEnable=false) {
    pushUndo(`Exam schedule regenerated`);
    setGeneratingExam(true); setExamSummary(null);
    setTimeout(() => {
      const sched = generateExamSchedule();
      setExamSchedule(sched);
      const total = Object.values(sched).reduce((s,c)=>s+Object.values(c).flat().filter(Boolean).length, 0);
      const summary = { totalExams: total, classes: CLASSES.length, invigilators: ALL_TEACHERS.length };
      setExamSummary(summary); setGeneratingExam(false);
      if (alsoEnable) setExamMode(true);
      addActivity(`📝 Exam schedule generated — ${total} exams across ${CLASSES.length} classes.`);
      addNotification(`📝 Exam schedule generated — ${total} total exams.`, "exam");
      showToast(`Exam schedule generated — ${total} exams scheduled.`);
    }, 800);
  }

  const unreadNotifs = notifications.length;
  const conflictCount = conflicts.length;

  return (
    <div className="flex h-screen bg-slate-50 font-['Inter',sans-serif] text-slate-800 overflow-hidden">
      <style>{`
        @keyframes fadeIn  { from{opacity:0;transform:translateY(-3px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(8px)}  to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── SIDEBAR ── */}
      <aside className="w-52 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-slate-100">
          <div className="w-7 h-7 bg-teal-600 rounded-md flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.8" className="w-4 h-4">
              <rect x="2" y="3" width="16" height="14" rx="2"/>
              <line x1="7" y1="1" x2="7" y2="5"/><line x1="13" y1="1" x2="13" y2="5"/>
              <line x1="2" y1="8" x2="18" y2="8"/>
            </svg>
          </div>
          <div>
            <div className="text-[13px] font-bold text-slate-800 leading-none">SmartTimetable</div>
            <div className="text-[10px] text-slate-400 mt-0.5">SIH 2024 · Day 10</div>
          </div>
        </div>
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={()=>setActiveNav(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[12.5px] font-medium transition-colors text-left
                ${activeNav===item.id?"bg-teal-50 text-teal-700":"text-slate-600 hover:bg-slate-50 hover:text-slate-800"}`}>
              <span className={activeNav===item.id?"text-teal-600":"text-slate-400"}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="px-3 py-3 border-t border-slate-100">
          <div className="text-[10.5px] text-slate-400 font-semibold uppercase tracking-wide mb-2 px-1">Active Class</div>
          <div className="space-y-0.5">
            {CLASSES.map(cls => (
              <button key={cls} onClick={()=>setActiveClass(cls)}
                className={`w-full text-left px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors
                  ${activeClass===cls?"bg-teal-600 text-white":"text-slate-600 hover:bg-slate-50"}`}>
                {cls}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── HEADER ── */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                <circle cx="8" cy="8" r="5"/><path d="M13 13l4 4" strokeLinecap="round"/>
              </svg>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search classes, teachers…"
                className="pl-8 pr-3 py-1.5 text-[12.5px] border border-slate-200 rounded-md bg-slate-50 text-slate-700 placeholder-slate-400 outline-none focus:border-teal-400 w-52"/>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button onClick={()=>setNotifOpen(o=>!o)}
                className="w-8 h-8 rounded-md border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center relative">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-4 h-4 text-slate-500">
                  <path d="M10 2a6 6 0 00-6 6v3l-1.5 2.5h15L16 11V8a6 6 0 00-6-6z"/><path d="M8.5 16.5a1.5 1.5 0 003 0"/>
                </svg>
                {unreadNotifs>0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unreadNotifs>9?"9+":unreadNotifs}</span>}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-10 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-40 overflow-hidden animate-[fadeIn_.15s_ease]">
                  <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-slate-600">Notifications</span>
                    {unreadNotifs>0 && <button onClick={()=>setNotifications([])} className="text-[10.5px] text-teal-600 hover:underline">Clear all</button>}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length===0
                      ? <div className="px-3 py-4 text-[12px] text-slate-400 text-center">No notifications.</div>
                      : notifications.map(n=>(
                          <div key={n.id} className="px-3 py-2.5 border-b border-slate-50 last:border-0 flex items-start justify-between gap-2 hover:bg-slate-50/60">
                            <div><div className="text-[11.5px] text-slate-700">{n.msg}</div><div className="text-[10.5px] text-slate-400 mt-0.5">{n.time}</div></div>
                            <button onClick={()=>dismissNotification(n.id)} className="text-[10.5px] text-slate-400 hover:text-slate-600 flex-shrink-0 mt-0.5">✕</button>
                          </div>
                        ))
                    }
                  </div>
                </div>
              )}
            </div>

            {/* User */}
            <div className="relative pl-2 border-l border-slate-100" ref={userRef}>
              <button onClick={()=>setUserMenuOpen(o=>!o)} className="flex items-center gap-2 hover:bg-slate-50 rounded-md px-1.5 py-1 transition-colors">
                <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-white text-[11px] font-bold">HK</div>
                <div className="text-[12.5px] font-medium text-slate-700">Harish Kumar</div>
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3 h-3 text-slate-400"><polyline points="2,4 6,8 10,4"/></svg>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-10 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-40 overflow-hidden animate-[fadeIn_.15s_ease]">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="text-[13px] font-semibold text-slate-800">Harish Kumar</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">harish.demo@smarttimetable.com</div>
                    <span className="inline-block mt-1.5 text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 rounded-full px-2 py-px">Administrator</span>
                  </div>
                  <button className="w-full text-left px-4 py-2.5 text-[12.5px] text-slate-600 hover:bg-slate-50 transition-colors">My Profile</button>
                  <button className="w-full text-left px-4 py-2.5 text-[12.5px] text-slate-600 hover:bg-slate-50 transition-colors">Account Settings</button>
                  <div className="border-t border-slate-100"/>
                  <button onClick={handleSignOut} className="w-full text-left px-4 py-2.5 text-[12.5px] text-red-500 hover:bg-red-50 transition-colors">Sign out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Page heading */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[17px] font-bold text-slate-800">Dashboard</h1>
              <p className="text-[12px] text-slate-400 mt-0.5">Manage timetables, teachers, and schedules for all classes.</p>
            </div>
            <div className="flex gap-2 items-center flex-wrap">

              {/* Exam Mode */}
              <button onClick={handleToggleExamMode} disabled={generatingExam}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-semibold rounded-md border transition-colors duration-200
                  ${examMode?"bg-teal-600 text-white border-teal-600":"bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5"><rect x="2" y="2" width="12" height="12" rx="1.5"/><path d="M5 8h6M5 5.5h6M5 10.5h3"/></svg>
                {generatingExam?"Generating…":`Exam Mode ${examMode?"On":"Off"}`}
              </button>

              {examMode && (
                <button onClick={()=>handleGenerateExamSchedule(true)} disabled={generatingExam}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-semibold rounded-md border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors">
                  {generatingExam?<><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25"/><path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>Generating…</>:"🔄 Generate Exam Schedule"}
                </button>
              )}

              {/* Emergency */}
              <button onClick={()=>setEmergencyOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-semibold rounded-md border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">
                <span className="animate-pulse">⚠</span> Emergency Mode
              </button>

              {/* Undo */}
              <button onClick={handleUndo} disabled={undoStack.length===0}
                title={undoStack[0]?`Undo: ${undoStack[0].label}`:"Nothing to undo"}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-medium rounded-md border transition-colors
                  ${undoStack.length>0?"border-slate-200 bg-white text-slate-600 hover:bg-slate-50":"border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"}`}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5"><path d="M3 7H10a4 4 0 010 8H6" strokeLinecap="round"/><path d="M3 7L6 4M3 7l3 3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Undo
                {undoStack.length>0 && <span className="text-[10px] bg-slate-100 text-slate-500 rounded-full px-1.5">{undoStack.length}</span>}
              </button>

              {/* Export PDF dropdown */}
              <div className="relative" ref={exportRef}>
                <button onClick={()=>setExportOpen(o=>!o)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-medium border border-slate-200 rounded-md bg-white text-slate-600 hover:bg-slate-50">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M8 2v8m-3-3l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 13h10" strokeLinecap="round"/></svg>
                  Export / Print
                  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3 h-3 text-slate-400"><polyline points="2,4 6,8 10,4"/></svg>
                </button>
                {exportOpen && (
                  <ExportMenu
                    activeClass={activeClass}
                    timetable={timetable}
                    examSchedule={examSchedule}
                    examMode={examMode}
                    activityLog={activityLog}
                    onClose={()=>setExportOpen(false)}
                    showToast={showToast}
                  />
                )}
              </div>

              <button onClick={()=>setConfirmDialog({
                message:`Reset and create a blank timetable for ${activeClass}? This will clear all existing entries for this class.`,
                confirmLabel:"Reset & Create",
                danger:true,
                onConfirm:()=>{
                  setConfirmDialog(null);
                  pushUndo(`Timetable reset for ${activeClass}`);
                  const blankGrid={};
                  SCHEDULABLE_PERIOD_IDS.forEach(pid=>{ blankGrid[pid]=Array(5).fill(null); });
                  setTimetable(prev=>({...prev,[activeClass]:blankGrid}));
                  recalcConflicts({...timetable,[activeClass]:blankGrid});
                  addActivity(`🗑️ Timetable for ${activeClass} cleared — ready for fresh schedule.`);
                  showToast(`Timetable for ${activeClass} cleared. Auto-generate or fill manually.`, "info");
                },
              })} className="px-3 py-1.5 text-[12.5px] font-semibold bg-teal-600 text-white rounded-md hover:bg-teal-700">+ New Timetable</button>
            </div>
          </div>

          {/* Emergency notice */}
          {emergencyNotice && (
            <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-[12.5px] text-emerald-700 animate-[fadeIn_.25s_ease]">
              <span className="flex items-center gap-2 font-medium">
                <span className="inline-flex w-4 h-4 rounded-full bg-emerald-500 text-white items-center justify-center text-[10px]">✓</span>
                {emergencyNotice}
              </span>
              <button onClick={()=>setEmergencyNotice(null)} className="text-emerald-600 hover:underline flex-shrink-0">Dismiss</button>
            </div>
          )}

          {/* Exam summary banner */}
          {examSummary && examMode && (
            <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-teal-50/70 border border-teal-200 rounded-lg text-[12.5px] text-teal-700 animate-[fadeIn_.25s_ease]">
              <span className="flex items-center gap-2 font-medium">
                <span className="inline-flex w-4 h-4 rounded-full bg-teal-500 text-white items-center justify-center text-[10px]">✓</span>
                Exam schedule generated — {examSummary.totalExams} exams across {examSummary.classes} classes with {examSummary.invigilators} invigilators.
              </span>
              <button onClick={()=>setExamSummary(null)} className="text-teal-600 hover:underline flex-shrink-0">Dismiss</button>
            </div>
          )}

          {/* ── STAT CARDS ── */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label:"Classes",   val:"24",                                       sub:"8 sections active",  dot:"bg-emerald-400" },
              { label:"Teachers",  val:String(ALL_TEACHERS.length),                sub:"2 on leave today",   dot:"bg-blue-400"    },
              { label:"Subjects",  val:String(Object.keys(TEACHER_ROOM).length),   sub:"Across all streams", dot:"bg-orange-400"  },
              { label:"Conflicts", val:String(conflictCount), sub:conflictCount>0?"Needs attention":"All clear", dot:conflictCount>0?"bg-red-400":"bg-emerald-400" },
            ].map(s=>(
              <div key={s.label} className="bg-white border border-slate-200 rounded-lg px-4 py-3">
                <div className="flex items-center gap-1.5 text-[11.5px] text-slate-500 font-medium mb-1.5">
                  <span className={`inline-block w-2 h-2 rounded-full ${s.dot}`}/>{s.label}
                </div>
                <div className="text-[22px] font-bold text-slate-800 leading-none">{s.val}</div>
                <div className="text-[11px] text-slate-400 mt-1">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* ── TIMETABLE ── */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div>
                <span className="text-[13.5px] font-semibold text-slate-700">{examMode?"Exam Schedule":"Weekly Timetable"}</span>
                <span className="text-[11.5px] text-slate-400 ml-2">{examMode?`Exam-day schedule for ${activeClass}`:"Click any cell to edit"}</span>
              </div>
              {!examMode && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    {Object.entries(SUBJECT_COLORS).slice(0,5).map(([s,c])=>(
                      <span key={s} className="flex items-center gap-1">
                        <span className={`inline-block w-2 h-2 rounded-sm ${c.bg} border ${c.border.replace("border-l-","border-")}`}/>{s}
                      </span>
                    ))}
                  </div>
                  <button onClick={handleAutoGenerate} disabled={generating}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-semibold rounded-md transition-colors
                      ${generating?"bg-teal-100 text-teal-500 cursor-wait":"bg-teal-600 text-white hover:bg-teal-700"}`}>
                    {generating?<><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25"/><path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>Generating timetable…</>:<>⚡ Auto Generate Timetable</>}
                  </button>
                </div>
              )}
            </div>

            {!examMode && genSummary && !generating && (
              <div className="px-4 py-3 border-b border-slate-100 bg-emerald-50/70 flex items-center justify-between flex-wrap gap-2 animate-[fadeIn_.25s_ease]">
                <div className="flex items-center gap-2 text-[12.5px] font-semibold text-emerald-700">
                  <span className="inline-flex w-5 h-5 rounded-full bg-emerald-500 text-white items-center justify-center text-[11px]">✓</span>
                  Timetable generated successfully.
                </div>
                <div className="flex items-center gap-4 text-[11.5px]">
                  <span className="flex items-center gap-1.5 text-slate-600"><span className="text-teal-500">📘</span><span className="font-bold text-slate-800">{genSummary.subjectsAssigned}</span> subjects assigned</span>
                  <span className="flex items-center gap-1.5 text-slate-600"><span className="text-amber-500">⚖️</span><span className="font-bold text-slate-800">{genSummary.conflictsResolved}</span> conflicts resolved</span>
                  <span className="flex items-center gap-1.5 text-slate-600"><span className="text-blue-500">🏫</span><span className="font-bold text-slate-800">{genSummary.roomsAllocated}</span> rooms allocated</span>
                  <button onClick={()=>setGenSummary(null)} className="text-emerald-600 hover:underline">Dismiss</button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr>
                    <th className="bg-slate-50 border border-slate-200 px-3 py-2 text-left text-[11px] font-semibold text-slate-400 w-24">Time</th>
                    {DAYS.map(d=><th key={d} className="bg-teal-50 border border-slate-200 px-2 py-2 text-[11px] font-semibold text-teal-700 text-center">{d}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map(p=>{
                    if (p.isBreak) return (
                      <tr key={p.id}><td colSpan={6} className="bg-slate-50 text-center text-[11px] text-slate-400 py-1.5 border border-slate-200 italic tracking-wide">— {p.text} —</td></tr>
                    );
                    const row = examMode ? (examGrid[p.id]||[]) : (grid[p.id]||[]);
                    const hasConflict = !examMode && row.some(c=>c&&c.conflict);
                    return (
                      <tr key={p.id} className={hasConflict?"bg-red-50/40":""}>
                        <td className="border border-slate-200 bg-slate-50 px-3 py-1 text-[10.5px] text-slate-400 font-medium whitespace-nowrap align-middle text-center">{p.label}</td>
                        {DAYS.map((_,di)=>(
                          <td key={di} className="border border-slate-200 p-0 align-top">
                            {examMode
                              ? <ExamCell exam={row[di]}/>
                              : <SubjectCell cell={row[di]} onEdit={cell=>handleCellClick(p.id,di,cell)}/>
                            }
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── BOTTOM ROW ── */}
          <div className="grid grid-cols-2 gap-3">

            {/* Conflict alerts */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[13px] font-semibold text-slate-700">Conflict Alerts</span>
                {conflicts.length>0 && <span className="text-[10px] font-bold bg-red-50 text-red-500 border border-red-200 rounded-full px-2 py-px">{conflicts.length} unresolved</span>}
              </div>
              <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                {conflicts.length===0
                  ? <div className="px-4 py-4 text-[12.5px] text-slate-400 flex items-center gap-2"><span className="text-emerald-500">✓</span> No scheduling conflicts detected.</div>
                  : conflicts.map(c=>(
                      <div key={c.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-200 rounded px-1.5 py-px">⚠ {c.class}</span>
                              <span className="text-[11px] text-slate-500">{c.day} · {c.period}</span>
                            </div>
                            <div className="text-[12px] font-medium text-slate-700">{c.teacher} — {c.room}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{c.note}</div>
                          </div>
                          <button onClick={()=>dismissConflict(c.id)} className="text-[11px] text-teal-600 hover:underline whitespace-nowrap flex-shrink-0 mt-0.5">Dismiss</button>
                        </div>
                      </div>
                    ))
                }
              </div>
            </div>

            {/* Recent activity */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[13px] font-semibold text-slate-700">Recent Activity</span>
                <div className="flex items-center gap-2">
                  {activityLog.length>0 && (
                    <button onClick={()=>{ const ok=printHTML(buildActivityReportHTML(activityLog, nowDate()), true); if(ok) showToast("Activity report export opened — choose 'Save as PDF'.", "info"); }} className="text-[10.5px] text-teal-600 hover:underline flex items-center gap-1">
                      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3"><path d="M6 1v7m-2-2l2 2 2-2" strokeLinecap="round"/><path d="M2 10h8" strokeLinecap="round"/></svg>
                      Export
                    </button>
                  )}
                  {activityLog.length>5 && (
                    <button onClick={()=>setConfirmDialog({message:"Clear all activity logs?",onConfirm:()=>{setActivityLog([]);setConfirmDialog(null);}})}
                      className="text-[10.5px] text-slate-400 hover:text-slate-600">Clear</button>
                  )}
                </div>
              </div>
              <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                {activityLog.length===0
                  ? <div className="px-4 py-4 text-[12.5px] text-slate-400">No activity yet.</div>
                  : activityLog.map((a,i)=>{
                      const isE=a.msg.includes("⚠")||a.msg.includes("Emergency");
                      const isX=a.msg.includes("📝")||a.msg.includes("📋");
                      const dot=isE?"bg-amber-400":isX?"bg-blue-400":"bg-teal-400";
                      return (
                        <div key={i} className="px-4 py-2.5 flex items-start gap-2.5 hover:bg-slate-50/70 transition-colors duration-200 animate-[fadeIn_.3s_ease]">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${dot}`}/>
                          <div>
                            <div className="text-[12px] text-slate-700">{a.msg}</div>
                            <div className="text-[10.5px] text-slate-400 mt-0.5">{a.time}</div>
                          </div>
                        </div>
                      );
                    })
                }
              </div>
            </div>

          </div>
        </main>

        {/* ── FOOTER ── */}
        <footer className="h-9 bg-white border-t border-slate-200 flex items-center justify-center px-5 flex-shrink-0">
          <span className="text-[11px] text-slate-400">
            <span className="font-semibold text-teal-700">SmartTimetable</span>
            <span className="mx-1.5 text-slate-300">·</span>
            30 Days · 30 SIH Solutions
            <span className="mx-1.5 text-slate-300">·</span>
            <span className="font-medium text-slate-500">Day 10</span>
          </span>
        </footer>
      </div>

      {/* ── TOAST ── */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium flex items-center gap-2.5 animate-[slideUp_.25s_ease] max-w-sm
          ${toast.type==="error"?"bg-red-600 text-white":toast.type==="info"?"bg-slate-700 text-white":"bg-emerald-600 text-white"}`}>
          <span>{toast.type==="error"?"⚠":"✓"}</span>
          {toast.msg}
          <button onClick={()=>setToast(null)} className="ml-1 opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* ── MODALS ── */}
      {editTarget && <EditModal cell={editTarget.cell} onSave={handleSave} onClose={()=>setEditTarget(null)}/>}
      {emergencyOpen && <EmergencyModal timetable={timetable} onClose={()=>setEmergencyOpen(false)} onAssign={handleAssignSubstitute}/>}
      {confirmDialog && <ConfirmDialog message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={()=>setConfirmDialog(null)}/>}
    </div>
  );
}
