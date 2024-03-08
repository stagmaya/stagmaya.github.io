import {ClosePreload, ScheduleTrackDown, ScheduleTrackUp} from './animation.js'
import {DATABASE_URL, GetGDID, GetData} from './database.js'
import {GeneratePDFSchedule} from './pdf_generator.js'

window.onbeforeunload = function () {
    window.scroll({
        top: 0,
        left: 0,
        behavior: 'instant'
    })
}

/**
 * ~ Global Value ~
 */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const TODAY = new Date()
const TODAYS_DATE = DateToInt(TODAY)
const TODAYS_YEAR = TODAY.getUTCFullYear()
let RESET_INDEX_DATE = TODAY
let INDEX_DATE = TODAY

let start_time = GetCurrentTimeInSeconds()
let selected_dropdown = "";
let pdf_data = {}
let isStudent = false;
let lock_next_prev = {curr_page: 0, max_back: 0, max_next: 1}
let isDarkMode = false
let isScheduleDown = true

if(GetDayNamesFromDate(TODAY).match(DAYS[6]) && TODAY.getHours() >= 17) {
    lock_next_prev.curr_page = 1
    lock_next_prev.max_back -= 1
    lock_next_prev.max_next -= 1
    IndexDateNextPrevWeek()
    RESET_INDEX_DATE = INDEX_DATE
}

// Query Value
const dropdown_trigger = document.querySelector(".trigger");
const dropdown_placeholder = document.querySelector(".placeholder");
const dropdown_selector = document.querySelector(".selection");
const role_switch = document.querySelector(".role_switch #switcher");
const nav_year_month = document.querySelector(".schedule_nav .year_month");
const next_schedule = document.querySelector(".nav_wrapper .next .circle");
const prev_schedule = document.querySelector(".nav_wrapper .prev .circle");
const dark_light_switch = document.querySelector(".dark_light_switch");
const switch_bulb = document.querySelectorAll("#dark_light_switch .switch_bulb");
const switch_bottom_bulb = document.querySelectorAll("#dark_light_switch .switch_bottom");
const switch_shine_bulb = document.querySelectorAll("#dark_light_switch .switch_shine");
const schedule_track = document.querySelector(".schedule_wrapper .schedule_container .track");
const schedule_wrapper = document.querySelector(".schedule_wrapper");
const start_section = document.querySelector(".Start");
const tag_name = document.querySelector(".tag_name");
const year_semester = document.querySelector(".year_semester");
const nav_down = document.querySelector(".nav_down");
const download_btn = document.querySelector(".download_btn")
const root = document.querySelector(':root')

/**
 * ~ Independent Function ~
 */
const zeroPad = (num, places=4) => String(num).padStart(places, '0');

function ZeroRemover(target) {
    while(target.indexOf(0) == '0') {
        target = target.slice(1, target.length)
    }
    return target
}

function SetColor() {
    if(isDarkMode) {
        root.style.setProperty('--background', '#0F0F0F')
        root.style.setProperty('--text_1', '#F0F0F0')
        root.style.setProperty('--text_2', '#B7B7B7')
        root.style.setProperty('--text_3', '#808080')
        root.style.setProperty('--text_4', '#484848')
        root.style.setProperty('--blue', '#A3BED9')
        root.style.setProperty('--green', '#99B888')
        root.style.setProperty('--red', '#EE7777')
        root.style.setProperty('--yellow', '#E6DC77')

        root.style.setProperty('--changes_red', '#360A0A')
        root.style.setProperty('--changes_green', '#0A3612')
        root.style.setProperty('--changes_blue', '#0A2E36')
        root.style.setProperty('--changes_yellow', '#33360A')
        root.style.setProperty('--changes_purple', '#1E0F21')
    }
    else {
        root.style.setProperty('--background', '#F0F0F0')
        root.style.setProperty('--text_1', '#0F0F0F')
        root.style.setProperty('--text_2', '#484848')
        root.style.setProperty('--text_3', '#808080')
        root.style.setProperty('--text_4', '#B7B7B7')
        root.style.setProperty('--blue', '#B6E5F2')
        root.style.setProperty('--green', '#B6F2C2')
        root.style.setProperty('--red', '#FFB5B3')
        root.style.setProperty('--yellow', '#F7E5A1')

        root.style.setProperty('--changes_red', '#E3D2CC')
        root.style.setProperty('--changes_green', '#C5D4C5')
        root.style.setProperty('--changes_blue', '#BDD5D9')
        root.style.setProperty('--changes_yellow', '#D9D7BF')
        root.style.setProperty('--changes_purple', '#D6CCDB')
    }
}

function DateToInt(date) {
    if (date.getMonth() < 10) {
        if (date.getDate() < 10) {
            return parseInt(String(date.getUTCFullYear()) + '0' + String(date.getMonth() + 1) + '0' + String(date.getDate()))
        }
        else {
            return parseInt(String(date.getUTCFullYear()) + '0' + String(date.getMonth() + 1) + String(date.getDate()))
        }
    }
    else {
        if (date.getDate() < 10) {
            return parseInt(String(date.getUTCFullYear()) + String(date.getMonth() + 1) + '0' + String(date.getDate()))
        }
        else {
            return parseInt(String(date.getUTCFullYear()) + String(date.getMonth() + 1) + String(date.getDate()))
        }
    }
}

function GetSecondsDifferent(start_time) {
    return (GetCurrentTimeInSeconds() - start_time)
}

function GetDayNamesFromDate(date = new Date(), locale = 'en-US') {
    return date.toLocaleDateString(locale, {weekday: 'short'});
}

function GetMonthNamesFromDate(date = new Date(), locale = 'en-US') {
    return date.toLocaleDateString(locale, {month: 'short'});
}

function GetCurrentTimeInSeconds() {
    let result = new Date();
    return (result.getHours() * 3600 + result.getMinutes() * 60 + result.getSeconds());
}

function GetDayBeforeAfter(date = new Date(), step) {
    return new Date(date.setDate(date.getDate() + step))
}

function IndexDateNextPrevWeek(isNext = true) {
    for(let i = 0; i < 7; i++) {
        if(isNext) {
            INDEX_DATE = GetDayBeforeAfter(INDEX_DATE, 1)
        }
        else {
            INDEX_DATE = GetDayBeforeAfter(INDEX_DATE, -1)
        }
    }
}

function GetDateRange() {
    let index_day = DAYS.indexOf(GetDayNamesFromDate(INDEX_DATE))
    let start_index_date = INDEX_DATE
    while(index_day > 0) {
        start_index_date = GetDayBeforeAfter(start_index_date, -1)
        index_day--
    }

    let result = {date: [], month: [], year: [], dateInt: []}
    while(index_day < 7) {
        result.date.push(start_index_date.getDate())
        const m = GetMonthNamesFromDate(start_index_date)
        if(result.month.indexOf(m) == -1) {
            result.month.push(m)
        }

        const y = start_index_date.getFullYear()
        if(result.year.indexOf(y) == -1) {
            result.year.push(y)
        }
        
        result.dateInt.push(DateToInt(start_index_date))
        start_index_date = GetDayBeforeAfter(start_index_date, 1)
        index_day++
    }
    return result
}

function MergeStudyBreakTime(study_time, break_time) {
    let result = {ListTime: []};
    study_time.forEach(x => {
        let temp = x[0] + " - " + x[1]
        result.ListTime.push(temp)
        result[temp] = true //True if it is study time
    })

    break_time.forEach(x => {
        let temp = x[0] + " - " + x[1]
        result.ListTime.push(temp)
        result[temp] = false //False if it is break time
    })

    result.ListTime.sort()
    return result
}

function PropertyToList(prop, isZeroPadActive=false) {
    let value = []
    let idx = []
    Object.entries(prop).forEach(entry => {
        if(isZeroPadActive){
            idx.push(zeroPad(entry[0]))
        }
        else {
            idx.push(String(entry[0]))
        }
        
        value.push(String(entry[1]))
    })

    return [idx, value]
}

function GetDataInFormat(data) {
    let result = {}
    for(let i = 0; i < data.length; i++) {
        result[String(data[i][0])] = data[i][1]
    }

    return result
}

function Get2DArrayTo1DArray(arr, isVertical=false) {
    let result = new Array()
    if (isVertical) {
        for(let i = 0; i < arr.length; i++) {
            result.push(arr[i][0])
        }
    }
    else {
        for(let i = 0; i < arr[0].length; i++) {
            result.push(arr[0][i])
        }
    }

    return result
}

function GetTeacherScheduleFormat(schedule_arr, class_list, study_time) {
    let result = {ListTeacherID: []}
  
    for (let i = 0; i < schedule_arr.length; i++) {
        const dayIndex = Math.floor(i / study_time.length)
        const timeIndex = (i % study_time.length)
        const timeString = study_time[timeIndex][0] + " - " + study_time[timeIndex][1]
  
        for (let j = 0; j < class_list.length; j++) {
            if(schedule_arr[i][j] != null) {
                if(schedule_arr[i][j].indexOf('_') != -1) {
                    let temp = schedule_arr[i][j].split("_")
                    let x = zeroPad(temp[0])

                    if (!result[x]) {
                        result[x] = {ListDay: []}
                        result.ListTeacherID.push(x)
                    }
                    if (!result[x][DAYS[dayIndex]]) {
                        result[x][DAYS[dayIndex]] = {ListTime: []}
                        result[x].ListDay.push(DAYS[dayIndex])
                    }
                    result[x][DAYS[dayIndex]][timeString] = {
                        "CourseID": temp[1],
                        "ClassID": class_list[j]
                    }
                    result[x][DAYS[dayIndex]].ListTime.push(timeString)
                }
            }
        }
    }
    result.ListTeacherID.sort()
    return result
}

function GetClassScheduleFormat(schedule_arr, class_list, study_time) {
    let result = {}
  
    for (let i = 0; i < schedule_arr.length; i++) {
        const dayIndex = Math.floor(i / study_time.length)
        const timeIndex = (i % study_time.length)
        const timeString = study_time[timeIndex][0] + " - " + study_time[timeIndex][1]
        
        for (let j = 0; j < class_list.length; j++) {
            if(schedule_arr[i][j] != null) {
                if(schedule_arr[i][j].indexOf('_') != -1) {
                    let temp = schedule_arr[i][j].split("_")
        
                    if (!result[class_list[j]]) {
                        result[class_list[j]] = {ListDay: []}
                    }
                    if (!result[class_list[j]][DAYS[dayIndex]]) {
                        result[class_list[j]][DAYS[dayIndex]] = {ListTime: []}
                        result[class_list[j]].ListDay.push(DAYS[dayIndex])
                    }
                    result[class_list[j]][DAYS[dayIndex]][timeString] = {
                        "CourseID": temp[1],
                        "TeacherID": zeroPad(temp[0])
                    }
                    result[class_list[j]][DAYS[dayIndex]].ListTime.push(timeString)
                }
            }
        }
    }

    return result
}

function HolidayDateFormater(dates) {
    let holiday_start = []
    let holiday_end = []

    dates.forEach(data => {
        holiday_start.push(DateToInt(new Date(data[0])))
        holiday_end.push(DateToInt(new Date(data[1])))
    })

    return [holiday_start, holiday_end]
}

function TeacherIDNameFormat(teachers_id, teachers_name) {
    let result = []
    for (let i = 0; i < teachers_id.length; i++) {
        result.push("[" + ZeroRemover(teachers_id[i]) + "] " + teachers_name[i])
    }

    return result
}



/**
 * ~ Loading Data  ~
 */
// Setup Website
const PRE_SETUP_WEBSITE = await GetData(GetGDID(DATABASE_URL), "Setup", "B6:D6")
const SETUP = {
  ACADEMIC_YEAR: PRE_SETUP_WEBSITE[0][0], 
  SEMESTER: PRE_SETUP_WEBSITE[0][1], 
  SCHEDULE_ID: GetGDID(PRE_SETUP_WEBSITE[0][2])
}

year_semester.innerHTML = SETUP.SEMESTER + " " + SETUP.ACADEMIC_YEAR

// Setup Schedule
const PRE_SETUP_SCHEDULE = await GetData(SETUP.SCHEDULE_ID, "Setup", "C2:C7")
const SCHEDULE_SETUP = {
  TOTAL_TEACHER: PRE_SETUP_SCHEDULE[0][0],
  TOTAL_CLASS: PRE_SETUP_SCHEDULE[1][0],
  TOTAL_COURSE: PRE_SETUP_SCHEDULE[2][0],
  TOTAL_DAY: PRE_SETUP_SCHEDULE[3][0],
  TOTAL_STUDY_TIME: PRE_SETUP_SCHEDULE[4][0],
  TOTAL_BREAK_TIME: PRE_SETUP_SCHEDULE[5][0]
}

// Setup list for study time & break time
const STUDY_TIME = await GetData(SETUP.SCHEDULE_ID, "Daftar Jam", ("B7:C" + (6 + SCHEDULE_SETUP.TOTAL_STUDY_TIME)))
const BREAK_TIME = await GetData(SETUP.SCHEDULE_ID, "Daftar Jam", ("E7:F" + (6 + SCHEDULE_SETUP.TOTAL_BREAK_TIME)))
const TOTAL_TIME = MergeStudyBreakTime(STUDY_TIME, BREAK_TIME)

// Setup teacher's data
const PRE_SETUP_TEACHER = await GetData(SETUP.SCHEDULE_ID, "Daftar Guru", ("B5:C" + (4 + SCHEDULE_SETUP.TOTAL_TEACHER)))
const TEACHERS_DATA = GetDataInFormat(PRE_SETUP_TEACHER)
const [teachers_id, teachers_name] = PropertyToList(TEACHERS_DATA, true)
const teacher_id_name = TeacherIDNameFormat(teachers_id, teachers_name)

// Setup Course Data
const PRE_SETUP_COURSE = await GetData(SETUP.SCHEDULE_ID, "Daftar Mata Pelajaran", ("B5:C" + (4 + SCHEDULE_SETUP.TOTAL_COURSE)))
const COURSE = GetDataInFormat(PRE_SETUP_COURSE)
const [course_id, course_name] = PropertyToList(COURSE)

// Setup Class
const PRE_SETUP_CLASS = await GetData(SETUP.SCHEDULE_ID, "Jadwal Utama", ("E5:" + String.fromCharCode('D'.charCodeAt(0) + SCHEDULE_SETUP.TOTAL_CLASS) + '5'))
const CLASS_LIST = Get2DArrayTo1DArray(PRE_SETUP_CLASS)

// Setup Schedule
const Schedule_SS_Name = "Jadwal Utama"
const Schedule_SS_Range = ("E6:" + String.fromCharCode('D'.charCodeAt(0) + SCHEDULE_SETUP.TOTAL_CLASS) + (5 + (SCHEDULE_SETUP.TOTAL_STUDY_TIME * SCHEDULE_SETUP.TOTAL_DAY)))
const Schedule_SST_Name = "Jadwal Sementara"
const Schedule_SST_Range = ("E8:" + String.fromCharCode('D'.charCodeAt(0) + SCHEDULE_SETUP.TOTAL_CLASS) + (7 + (SCHEDULE_SETUP.TOTAL_STUDY_TIME * SCHEDULE_SETUP.TOTAL_DAY)))

const SCHEDULE = await GetData(SETUP.SCHEDULE_ID, Schedule_SS_Name, Schedule_SS_Range)
const SCHEDULE_TEMP = await GetData(SETUP.SCHEDULE_ID, Schedule_SST_Name, Schedule_SST_Range)

const SCHEDULE_TEMP_DATE = await GetData(SETUP.SCHEDULE_ID, Schedule_SST_Name, "D2:D3", false)
const START_TEMP_DATE = DateToInt(new Date(SCHEDULE_TEMP_DATE[0][0]))
const END_TEMP_DATE = DateToInt(new Date(SCHEDULE_TEMP_DATE[1][0]))

// Schedule For Teacher
const TEACHERS_SCHEDULE = GetTeacherScheduleFormat(SCHEDULE, CLASS_LIST, STUDY_TIME)
const TEACHERS_SCHEDULE_TEMP = GetTeacherScheduleFormat(SCHEDULE_TEMP, CLASS_LIST, STUDY_TIME)

// Schedule For Student Class
const CLASS_SCHEDULE = GetClassScheduleFormat(SCHEDULE, CLASS_LIST, STUDY_TIME)
const CLASS_SCHEDULE_TEMP = GetClassScheduleFormat(SCHEDULE_TEMP, CLASS_LIST, STUDY_TIME)

// Get Holiday Date
const TOTAL_HOLIDAY = await GetData(SETUP.SCHEDULE_ID, "Tanggal Libur", ("B2:C2"))
const HOLIDAY_DATE = await GetData(SETUP.SCHEDULE_ID, "Tanggal Libur", ("B5:C" + (4 + TOTAL_HOLIDAY[0][1])), false)
const [start_holiday, end_holiday] = HolidayDateFormater(HOLIDAY_DATE)

/**
 * ~ Function Need Global Value ~
 */

function isTheDateHoliday(date) {
    let result = false
    if(TOTAL_HOLIDAY[0][1] > 0) {
        for (let i = 0; i < TOTAL_HOLIDAY[0][1]; i++) {
            if(date >= start_holiday[i] && date <= end_holiday[i]) {
                result = true
                break
            }
        }
    }
    return result
}

function GetTeachersID(name) {
    let result = teachers_name.indexOf(name);
    if (result != -1) {
        return zeroPad(teachers_id[result])
    }
    else {
        return String(result);
    }
}

function GetCourseName(id) {
    let result = course_id.indexOf(id);
    if (result != -1) {
        return course_name[result]
    }
    else {
        return String(result);
    }
}

function GetTeachersName(id) {
    let result = teachers_id.indexOf(id);
    if (result != -1) {
        return teachers_name[result]
    }
    else {
        return String(result);
    }
}

function UpdateScheduleData() {
    ResetPDFData()
    let date_range = GetDateRange()
    const total_list_time = TOTAL_TIME.ListTime
    pdf_data.ListDate = date_range.dateInt.slice(0, 6)
    let day_today = 0
    let result_innerHtml = ``
    let year_month_text = ""

    if(isStudent) {
        pdf_data.PDFTitle = "Kelas " + selected_dropdown
        for(let i = 0; i < 7; i++) {
            let day_name = DAYS[i]
            let isStudying = " active"
            let schedule_data = `<div class="item_wrapper">
                                    <div class="item_container">`
            
            if(i == 6 || isTheDateHoliday(date_range.dateInt[i])) {
                isStudying = " libur"
                if(i != 6) {
                    for(let x = 0; x < total_list_time.length; x++) {
                        if(TOTAL_TIME[total_list_time[x]]) {
                            pdf_data[day_name][total_list_time[x]] = "</holiday/>"
                        }
                    }
                    pdf_data.isScheduleChange = true
                }
            }
            else {
                if(date_range.dateInt[i] >= START_TEMP_DATE && date_range.dateInt[i] <= END_TEMP_DATE) {
                    if(CLASS_SCHEDULE_TEMP[selected_dropdown] != null) {
                        if(CLASS_SCHEDULE_TEMP[selected_dropdown].ListDay.indexOf(day_name) != -1) {
                            let break_idx = 1
                            let course_counter = 1

                            TOTAL_TIME.ListTime.forEach(time => {
                                if(TOTAL_TIME[time]) {
                                    if(CLASS_SCHEDULE_TEMP[selected_dropdown][day_name].ListTime.indexOf(time) != -1) {
                                        const course_id = CLASS_SCHEDULE_TEMP[selected_dropdown][day_name][time].CourseID
                                        const course_name = GetCourseName(course_id)
                                        const teacher_id = CLASS_SCHEDULE_TEMP[selected_dropdown][day_name][time].TeacherID
                                        let teacher_name = GetTeachersName(teacher_id)

                                        let isScheduleChange = false
                                        if(CLASS_SCHEDULE[selected_dropdown][day_name][time].CourseID != course_id || CLASS_SCHEDULE[selected_dropdown][day_name][time].TeacherID != teacher_id) {
                                            isScheduleChange = true
                                        }

                                        if(teacher_name.match("-1")) {
                                            teacher_name = ""
                                        }

                                        if(!course_name.match("-1")) {
                                            let label = "red"
                                            if(course_id.indexOf("S") != -1) {
                                                label = "green"
                                            }
                                            else if(course_id.indexOf("B") != -1) {
                                                label = "blue"
                                            }
                                            else if(course_id.indexOf("A") != -1) {
                                                label = "yellow"
                                            }
                                            else if(course_id.indexOf("K") != -1){
                                                label = "purple"
                                            }
                                            
                                            if(isScheduleChange) {
                                                pdf_data.isScheduleChange = true
                                                pdf_data[day_name][time] = "</changes/> " + course_name + " </spacer/> [" + ZeroRemover(teacher_id) + "] " + teacher_name
                                                schedule_data += `
                                                <div class="item_schedule ` + label + `">
                                                    <div class="item_label ` + label + `"></div>
                                                    <div class="inner_item">
                                                        <div class="time_and_name">
                                                        <span class="item_time">[` + course_counter + `] ` + time + `</span>
                                                            <span class="item_name">` + course_name + `</span>
                                                        </div>
                                                        <span class="teacher_name">[`+ ZeroRemover(teacher_id) +`] `+ teacher_name + `</span>
                                                    </div>
                                                </div>`
                                            }
                                            else {
                                                pdf_data[day_name][time] = course_name + " </spacer/> [" + ZeroRemover(teacher_id) + "] " + teacher_name
                                                schedule_data += `
                                                <div class="item_schedule">
                                                    <div class="item_label ` + label + `"></div>
                                                    <div class="inner_item">
                                                        <div class="time_and_name">
                                                        <span class="item_time">[` + course_counter + `] ` + time + `</span>
                                                            <span class="item_name">` + course_name + `</span>
                                                        </div>
                                                        <span class="teacher_name">[`+ ZeroRemover(teacher_id) +`] `+ teacher_name + `</span>
                                                    </div>
                                                </div>`
                                            }

                                            course_counter++
                                        }
                                    }
                                    else {
                                        schedule_data += `
                                            <div class="item_schedule">
                                                <div class="item_label non"></div>
                                                <div class="inner_item">
                                                    <div class="time_and_name">
                                                        <span class="item_time">[` + course_counter + `] ` + time + `</span>
                                                    </div>
                                                </div>
                                            </div>
                                        `
                                        course_counter++
                                    }
                                }
                                else {
                                    schedule_data += `
                                        <div class="item_schedule">
                                            <div class="item_label non"></div>
                                            <div class="inner_item">
                                                <div class="time_and_name">
                                                <span class="item_time">` + time + `</span>
                                                    <span class="item_name">Istirahat Ke-` + break_idx + `</span>
                                                </div>
                                            </div>
                                        </div>
                                    `
                                    break_idx++
                                }
                            })
                        }
                        else {
                            isStudying = ""
                        }
                    }
                    else {
                        isStudying = ""
                    }
                }
                else {
                    if(CLASS_SCHEDULE[selected_dropdown] != null) {
                        if(CLASS_SCHEDULE[selected_dropdown].ListDay.indexOf(day_name) != -1) {
                            let break_idx = 1
                            let course_counter = 1

                            TOTAL_TIME.ListTime.forEach(time => {
                                if(TOTAL_TIME[time]) {
                                    if(CLASS_SCHEDULE[selected_dropdown][day_name].ListTime.indexOf(time) != -1) {
                                        const course_id = CLASS_SCHEDULE[selected_dropdown][day_name][time].CourseID
                                        const course_name = GetCourseName(course_id)
                                        const teacher_id = CLASS_SCHEDULE[selected_dropdown][day_name][time].TeacherID
                                        let teacher_name = GetTeachersName(teacher_id)

                                        if(teacher_name.match("-1")) {
                                            teacher_name = ""
                                        }

                                        if(!course_name.match("-1")) {
                                            let label = "red"
                                            if(course_id.indexOf("S") != -1) {
                                                label = "green"
                                            }
                                            else if(course_id.indexOf("B") != -1) {
                                                label = "blue"
                                            }
                                            else if(course_id.indexOf("A") != -1) {
                                                label = "yellow"
                                            }
                                            else if(course_id.indexOf("K") != -1){
                                                label = "purple"
                                            }
                                            schedule_data += `
                                            <div class="item_schedule">
                                                <div class="item_label ` + label + `"></div>
                                                <div class="inner_item">
                                                    <div class="time_and_name">
                                                    <span class="item_time">[` + course_counter + `] ` + time + `</span>
                                                        <span class="item_name">` + course_name + `</span>
                                                    </div>
                                                    <span class="teacher_name">[`+ ZeroRemover(teacher_id) +`] `+ teacher_name + `</span>
                                                </div>
                                            </div>`

                                            pdf_data[day_name][time] = course_name + " </spacer/> [" + ZeroRemover(teacher_id) + "] " + teacher_name
                                            course_counter++
                                        }
                                    }
                                    else {
                                        schedule_data += `
                                            <div class="item_schedule">
                                                <div class="item_label non"></div>
                                                <div class="inner_item">
                                                    <div class="time_and_name">
                                                        <span class="item_time">[` + course_counter + `] ` + time + `</span>
                                                    </div>
                                                </div>
                                            </div>
                                        `
                                        course_counter++
                                    }
                                }
                                else {
                                    schedule_data += `
                                        <div class="item_schedule">
                                            <div class="item_label non"></div>
                                            <div class="inner_item">
                                                <div class="time_and_name">
                                                <span class="item_time">` + time + `</span>
                                                    <span class="item_name">Istirahat Ke-` + break_idx + `</span>
                                                </div>
                                            </div>
                                        </div>
                                    `
                                    break_idx++
                                }
                            })
                        }
                        else {
                            isStudying = ""
                        }
                    }
                    else {
                        isStudying = ""
                    }
                }
            }

            if(TODAYS_DATE == date_range.dateInt[i]) {
                day_name = "Today"
                day_today = i
            }

            result_innerHtml += `
                <div class="schedule_date">
                        <div class="item_header">
                            <span class="item_day` + isStudying + `">` + day_name + `</span>
                            <span class="item_date">` + date_range.date[i] + `</span>
                        </div>
                ` + schedule_data +
                        `<div class="spacer"></div>
                        </div>
                    </div>
                </div>`
        }
    }
    else {
        pdf_data.PDFTitle = selected_dropdown
        selected_dropdown = selected_dropdown.split("] ")[1]
        const target_id = GetTeachersID(selected_dropdown)
        if (target_id != "-1") {
            for(let i = 0; i < 7; i++) {
                let day_name = DAYS[i]
                let isTeaching = " active"
                let schedule_data = `<div class="item_wrapper">
                                        <div class="item_container">`
                
                if(i == 6 || isTheDateHoliday(date_range.dateInt[i])) {
                    isTeaching = " libur"
                    if(i != 6) {
                        for(let x = 0; x < total_list_time.length; x++) {
                            if(TOTAL_TIME[total_list_time[x]]) {
                                pdf_data[day_name][total_list_time[x]] = "</holiday/>"
                            }
                        }
                        pdf_data.isScheduleChange = true
                    }
                }
                else {
                    if(date_range.dateInt[i] >= START_TEMP_DATE && date_range.dateInt[i] <= END_TEMP_DATE) {
                        if(TEACHERS_SCHEDULE_TEMP[target_id] != null) {
                            if(TEACHERS_SCHEDULE_TEMP[target_id].ListDay.indexOf(day_name) != -1) {
                                let break_idx = 1
                                let course_counter = 1

                                TOTAL_TIME.ListTime.forEach(time => {
                                    if(TOTAL_TIME[time]) {
                                        if(TEACHERS_SCHEDULE_TEMP[target_id][day_name].ListTime.indexOf(time) != -1) {
                                            const course_id = TEACHERS_SCHEDULE_TEMP[target_id][day_name][time].CourseID
                                            const course_name = GetCourseName(course_id)
                                            const class_id = TEACHERS_SCHEDULE_TEMP[target_id][day_name][time].ClassID

                                            let isScheduleChange = false
                                            if(CLASS_SCHEDULE[class_id][day_name][time].CourseID != course_id || CLASS_SCHEDULE[class_id][day_name][time].TeacherID != target_id) {
                                                isScheduleChange = true
                                            }

                                            if(!course_name.match("-1")) {
                                                let label = "red"
                                                if(course_id.indexOf("S") != -1) {
                                                    label = "green"
                                                }
                                                else if(course_id.indexOf("B") != -1) {
                                                    label = "blue"
                                                }
                                                else if(course_id.indexOf("A") != -1) {
                                                    label = "yellow"
                                                }
                                                else if(course_id.indexOf("K") != -1){
                                                    label = "purple"
                                                }
                                                if(isScheduleChange) {
                                                    pdf_data.isScheduleChange = true
                                                    pdf_data[day_name][time] = "</changes/> "+  course_name + " </spacer/> " + class_id
                                                    schedule_data += `
                                                    <div class="item_schedule ` + label + `">
                                                        <div class="item_label ` + label + `"></div>
                                                        <div class="inner_item">
                                                            <div class="time_and_name">
                                                                <span class="item_time">[` + course_counter + `] ` + time + `</span>
                                                                <span class="item_name">` + course_name + `</span>
                                                            </div>
                                                            <span class="class_name">`+ class_id + `</span>
                                                        </div>
                                                    </div>`

                                                }
                                                else {
                                                    pdf_data[day_name][time] = course_name + " </spacer/> " + class_id
                                                    schedule_data += `
                                                    <div class="item_schedule">
                                                        <div class="item_label ` + label + `"></div>
                                                        <div class="inner_item">
                                                            <div class="time_and_name">
                                                                <span class="item_time">[` + course_counter + `] ` + time + `</span>
                                                                <span class="item_name">` + course_name + `</span>
                                                            </div>
                                                            <span class="class_name">`+ class_id + `</span>
                                                        </div>
                                                    </div>`
                                                }
                                                
                                                course_counter++
                                            }
                                        }
                                        else {
                                            schedule_data += `
                                                <div class="item_schedule">
                                                    <div class="item_label non"></div>
                                                    <div class="inner_item">
                                                        <div class="time_and_name">
                                                            <span class="item_time">[` + course_counter + `] ` + time + `</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            `
                                            course_counter++
                                        }
                                    }
                                    else {
                                        schedule_data += `
                                            <div class="item_schedule">
                                                <div class="item_label non"></div>
                                                <div class="inner_item">
                                                    <div class="time_and_name">
                                                    <span class="item_time">` + time + `</span>
                                                        <span class="item_name">Istirahat Ke-` + break_idx + `</span>
                                                    </div>
                                                </div>
                                            </div>
                                        `
                                        break_idx++
                                    }
                                })
                            }
                            else {
                                isTeaching = ""
                            }
                        }
                        else {
                            isTeaching = ""
                        }
                    }
                    else {
                        if(TEACHERS_SCHEDULE[target_id] != null) {
                            if(TEACHERS_SCHEDULE[target_id].ListDay.indexOf(day_name) != -1) {
                                let break_idx = 1
                                let course_counter = 1

                                TOTAL_TIME.ListTime.forEach(time => {
                                    if(TOTAL_TIME[time]) {
                                        if(TEACHERS_SCHEDULE[target_id][day_name].ListTime.indexOf(time) != -1) {
                                            const course_id = TEACHERS_SCHEDULE[target_id][day_name][time].CourseID
                                            const course_name = GetCourseName(course_id)
                                            const class_id = TEACHERS_SCHEDULE[target_id][day_name][time].ClassID

                                            if(!course_name.match("-1")) {
                                                let label = "red"
                                                if(course_id.indexOf("S") != -1) {
                                                    label = "green"
                                                }
                                                else if(course_id.indexOf("B") != -1) {
                                                    label = "blue"
                                                }
                                                else if(course_id.indexOf("A") != -1) {
                                                    label = "yellow"
                                                }
                                                else if(course_id.indexOf("K") != -1){
                                                    label = "purple"
                                                }
                                                schedule_data += `
                                                <div class="item_schedule">
                                                    <div class="item_label ` + label + `"></div>
                                                    <div class="inner_item">
                                                        <div class="time_and_name">
                                                            <span class="item_time">[` + course_counter + `] ` + time + `</span>
                                                            <span class="item_name">` + course_name + `</span>
                                                        </div>
                                                        <span class="class_name">`+ class_id + `</span>
                                                    </div>
                                                </div>`

                                                pdf_data[day_name][time] = course_name + " </spacer/> " + class_id

                                                course_counter++
                                            }
                                        }
                                        else {
                                            schedule_data += `
                                                <div class="item_schedule">
                                                    <div class="item_label non"></div>
                                                    <div class="inner_item">
                                                        <div class="time_and_name">
                                                            <span class="item_time">[` + course_counter + `] ` + time + `</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            `
                                            course_counter++
                                        }
                                    }
                                    else {
                                        schedule_data += `
                                            <div class="item_schedule">
                                                <div class="item_label non"></div>
                                                <div class="inner_item">
                                                    <div class="time_and_name">
                                                    <span class="item_time">`+ time +`</span>
                                                        <span class="item_name">Istirahat Ke-` + break_idx + `</span>
                                                    </div>
                                                </div>
                                            </div>
                                        `
                                        break_idx++
                                    }
                                })
                            }
                            else {
                                isTeaching = ""
                            }
                        }
                        else {
                            isTeaching = ""
                        }
                    }
                }

                if(TODAYS_DATE == date_range.dateInt[i]) {
                    day_name = "Today"
                    day_today = i
                }

                result_innerHtml += `
                    <div class="schedule_date">
                            <div class="item_header">
                                <span class="item_day` + isTeaching + `">` + day_name + `</span>
                                <span class="item_date">` + date_range.date[i] + `</span>
                            </div>
                    ` + schedule_data +
                            `<div class="spacer"></div>
                            </div>
                        </div>
                    </div>`
            }
        }
    }

    if(date_range.month.length == 2) {
        if(date_range.year == 2) {
            year_month_text = date_range.month[0] + " - " + date_range.month[1] + " " + date_range.year[1]
        }
        else {
            year_month_text = date_range.month[0] + " - " + date_range.month[1] + " " + date_range.year[0]
        }
    }
    else {
        year_month_text = date_range.month[0] + " " + date_range.year[0]
    }

    let margin_left = parseInt((schedule_track.currentStyle || window.getComputedStyle(schedule_track)).marginLeft);

    if (isScheduleDown) {
        schedule_track.innerHTML = result_innerHtml
        nav_year_month.innerHTML = year_month_text

        if(lock_next_prev.curr_page == 0 && day_today != 0) {
            schedule_wrapper.scrollLeft = ((schedule_track.getBoundingClientRect().width) / 7 * (day_today)) + margin_left
        }
        else {
            schedule_wrapper.scrollLeft = 0
        }

        setTimeout(function() {
            ScheduleTrackUp()
        }, 100)
        isScheduleDown = false
    }
    else {
        ScheduleTrackDown()
        setTimeout(function() {
            schedule_track.innerHTML = result_innerHtml
            nav_year_month.innerHTML = year_month_text
            if(lock_next_prev.curr_page == 0 && day_today != 0) {
                schedule_wrapper.scrollLeft = ((schedule_track.getBoundingClientRect().width) / 7 * (day_today)) + margin_left
            }
            else {
                schedule_wrapper.scrollLeft = 0
            }
        }, 1100)
        setTimeout(function() {
            ScheduleTrackUp()
        }, 1100)
        isScheduleDown = false
    }
}

function UpdateSchedule() {
    dropdown_placeholder.innerHTML = selected_dropdown;
    ResetPDFData()
    lock_next_prev.curr_page = 0
    INDEX_DATE = RESET_INDEX_DATE

    if((!prev_schedule.classList.contains("active") && lock_next_prev.max_back > 0) || (prev_schedule.classList.contains("active") && lock_next_prev.max_back <= 0)) {
        prev_schedule.classList.toggle("active")
    }
    if((!next_schedule.classList.contains("active") && lock_next_prev.max_next > 0) || (next_schedule.classList.contains("active") && lock_next_prev.max_next <= 0)) {
        next_schedule.classList.toggle("active")
    }
    UpdateScheduleData()
}

function AddDropdownSelection(list) {
    dropdown_selector.innerHTML = '';
  
    for(let i = 0; i < list.length; i++) {
        let x = '<li><p>'+ list[i] +'</p></li>'
        dropdown_selector.insertAdjacentHTML("beforeend", x)
    }
  
    const items = document.querySelectorAll('.selection li')
    items.forEach(item => {
        item.addEventListener('click',(e)=>{
            if(download_btn.classList.contains("active")) {
                download_btn.classList.toggle("active")
            }
                
            selected_dropdown = String(e.target.textContent)
            UpdateSchedule()

            setTimeout(function() {
                download_btn.classList.toggle("active")
            }, 1500)
        })
    })
}

function ResetPDFData() {
    pdf_data = {ListDay: DAYS.slice(0, 6), time: TOTAL_TIME, ListDate: [], PDFTitle: "", Year: SETUP.ACADEMIC_YEAR, Semester: SETUP.SEMESTER, isScheduleChange: false}
    const total_list_time = TOTAL_TIME.ListTime

    for (let i = 0; i < pdf_data.ListDay.length; i++) {
        const idx_day = pdf_data.ListDay[i]
        pdf_data[idx_day] = {}
        for (let j = 0; j < total_list_time.length; j++) {
            pdf_data[idx_day][total_list_time[j]] = ""

            if (!TOTAL_TIME[total_list_time[j]]) {
                pdf_data[idx_day][total_list_time[j]] = "</break time/>"
            }
        }
    }
}

/**
 * ~ Start Section ~
 */
nav_year_month.innerHTML = GetMonthNamesFromDate(TODAY) + " " + TODAYS_YEAR
gsap.to(".schedule_wrapper", {top: "100%", duration: 0})

if (GetSecondsDifferent(start_time) < 6) {
  while (GetSecondsDifferent(start_time) < 6) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
ClosePreload()

dark_light_switch.addEventListener("click", () => {
    isDarkMode = !isDarkMode

    if(isDarkMode) {
        start_section.classList.toggle("darken")
        tag_name.classList.toggle("darken")
        nav_down.classList.toggle("darken")
    }
    else {
        start_section.classList.toggle("lighten")
        tag_name.classList.toggle("lighten")
        nav_down.classList.toggle("lighten")
    }

    switch_bulb.forEach(x => {
        x.classList.toggle("active")
    })
    switch_bottom_bulb.forEach(x => {
        x.classList.toggle("active")
    })
    switch_shine_bulb.forEach(x => {
        x.classList.toggle("active")
    })

    SetColor()

    if(isDarkMode) {
        start_section.classList.toggle("darken")
        tag_name.classList.toggle("darken")
        nav_down.classList.toggle("darken")
    }
    else {
        start_section.classList.toggle("lighten")
        tag_name.classList.toggle("lighten")
        nav_down.classList.toggle("lighten")
    }
})


/**
 * ~ Schedule Section ~
 */
dropdown_trigger.addEventListener("click", () => {
    dropdown_trigger.classList.toggle("active");
});
AddDropdownSelection(teacher_id_name);


role_switch.addEventListener("click", () => {
    isStudent = !isStudent;
    isScheduleDown = true
    INDEX_DATE = RESET_INDEX_DATE
    ResetPDFData()
    if(download_btn.classList.contains("active")) {
        download_btn.classList.toggle("active")
    }

    if (isStudent) {
        AddDropdownSelection(CLASS_LIST);
        dropdown_placeholder.innerHTML = "Pilih kelas";
    }
    else {
        AddDropdownSelection(teacher_id_name);
        dropdown_placeholder.innerHTML = "Pilih nama guru";
    }

    ScheduleTrackDown()
    setTimeout(function() {
        schedule_track.innerHTML = ``
        nav_year_month.innerHTML = GetMonthNamesFromDate(TODAY) + " " + TODAYS_YEAR
    }, 1100)

    if(prev_schedule.classList.contains("active")) {
        prev_schedule.classList.toggle("active")
    }
    if(next_schedule.classList.contains("active")) {
        next_schedule.classList.toggle("active")
    }
});

next_schedule.addEventListener("click", () => {
    if(lock_next_prev.curr_page < lock_next_prev.max_next && next_schedule.classList.contains("active")) {
        lock_next_prev.curr_page += 1
        if(lock_next_prev.curr_page == lock_next_prev.max_next) {
            next_schedule.classList.toggle("active")
        }
        if(!prev_schedule.classList.contains("active")) {
            prev_schedule.classList.toggle("active")
        }
        if(download_btn.classList.contains("active")) {
            download_btn.classList.toggle("active")
        }
        IndexDateNextPrevWeek(true)
        UpdateScheduleData()

        setTimeout(function() {
            download_btn.classList.toggle("active")
        }, 1500)
    }
})

prev_schedule.addEventListener("click", () => {
    if((lock_next_prev.curr_page * -1) < lock_next_prev.max_back && prev_schedule.classList.contains("active")) {
        lock_next_prev.curr_page -= 1
        if((lock_next_prev.curr_page * -1) == lock_next_prev.max_back) {
            prev_schedule.classList.toggle("active")
        }
        if(!next_schedule.classList.contains("active")) {
            next_schedule.classList.toggle("active")
        }
        if(download_btn.classList.contains("active")) {
            download_btn.classList.toggle("active")
        }
        IndexDateNextPrevWeek(false)
        UpdateScheduleData()
        
        setTimeout(function() {
            download_btn.classList.toggle("active")
        }, 1500)
    }
})

download_btn.addEventListener("click", () => {
    if (download_btn.classList.contains("active") && pdf_data.PDFTitle != "") {
        GeneratePDFSchedule(pdf_data)
    }
})