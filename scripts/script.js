import {ClosePreload, ScheduleTrackDown, ScheduleTrackUp} from './animation.js'
import {DATABASE_URL, GetGDID, GetData} from './database.js'

window.onbeforeunload = function () {
window.scroll({
    top: 0,
    left: 0,
    behavior: 'instant'
});
}

/**
 * ~ Global Value ~
 */
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const TODAY = new Date()
const TODAYS_DATE = DateToInt(TODAY)
const TODAYS_DAY = TODAY.getDate()
const TODAYS_MONTH = TODAY.getMonth()
const TODAYS_YEAR = TODAY.getUTCFullYear()

let start_time = GetCurrentTimeInSeconds()
let selected_dropdown = "";
let isStudent = false;
let lock_next_prev = {curr_page: 0, max_back: 1, max_next: 1}
let isDarkMode = false
let isScheduleDown = true

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
const root = document.querySelector(':root')

/**
 * ~ Independent Function ~
 */
const zeroPad = (num, places=4) => String(num).padStart(places, '0');

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
        root.style.setProperty('--changes', '#233013')
    }
    else {
        root.style.setProperty('--background', '#F0F0F0')
        root.style.setProperty('--text_1', '#0F0F0F')
        root.style.setProperty('--text_2', '#484848')
        root.style.setProperty('--text_3', '#808080')
        root.style.setProperty('--text_4', '#B7B7B7')
        root.style.setProperty('--blue', '#B6E5F2')
        root.style.setProperty('--green', '#B6F2C2')
        root.style.setProperty('--red', '#F2B8B6')
        root.style.setProperty('--yellow', '#EBDEB0')
        root.style.setProperty('--changes', '#B6D7B9')
    }
}

function GetCurrentTimeInSeconds() {
    let result = new Date();
    return (result.getHours() * 3600 + result.getMinutes() * 60 + result.getSeconds());
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

function HolidayDateFormater(dates) {
    let holiday_start = []
    let holiday_end = []

    dates.forEach(data => {
        holiday_start.push(DateToInt(new Date(data[0])))
        holiday_end.push(DateToInt(new Date(data[1])))
    })

    return [holiday_start, holiday_end]
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
    let month = TODAYS_MONTH + lock_next_prev.curr_page
    let year = TODAYS_YEAR

    if (month > 11) {
        month = 0
        year = year + 1
    }
    else if (month < 0) {
        month = 11
        year = year - 1
    }
    let index_date = new Date(year, month + 1, 0)
    const end_day = (index_date).getDate()
    
    let result_innerHtml = ``
    if(isStudent) {
        for (let i = 1; i <= end_day ; i++) {
            const curr_date = new Date(year, month, i)
            let day_name = GetDayNamesFromDate(curr_date)
            const int_currDate = DateToInt(curr_date)

            let isStudying = " active"
            let schedule_data = `<div class="item_wrapper">
                                    <div class="item_container">`

            if(day_name.match("Sun") || isTheDateHoliday(int_currDate)) {
                isStudying = " libur"
            }
            else {
                if(int_currDate >= START_TEMP_DATE && int_currDate <= END_TEMP_DATE) {
                    if(CLASS_SCHEDULE_TEMP[selected_dropdown] != null) {
                        if(CLASS_SCHEDULE_TEMP[selected_dropdown].ListDay.indexOf(day_name) != -1) {
                            let break_idx = 1
                            let Total_course = CLASS_SCHEDULE_TEMP[selected_dropdown][day_name].ListTime.length
                            let counter = 0
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

                                        if(teacher_name == "-1") {
                                            teacher_name = ""
                                        }

                                        if(course_name != "-1") {
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
                                                schedule_data += `
                                                <div class="item_schedule changes">
                                                    <div class="item_label ` + label + `"></div>
                                                    <div class="inner_item">
                                                        <div class="time_and_name">
                                                        <span class="item_time">[` + course_counter + '] '+ time +`</span>
                                                            <span class="item_name">` + course_name + `</span>
                                                        </div>
                                                        <span class="teacher_name">`+ teacher_name + `</span>
                                                    </div>
                                                </div>`
                                            }
                                            else {
                                                schedule_data += `
                                                <div class="item_schedule">
                                                    <div class="item_label ` + label + `"></div>
                                                    <div class="inner_item">
                                                        <div class="time_and_name">
                                                        <span class="item_time">[` + course_counter + '] '+ time +`</span>
                                                            <span class="item_name">` + course_name + `</span>
                                                        </div>
                                                        <span class="teacher_name">`+ teacher_name + `</span>
                                                    </div>
                                                </div>`
                                            }

                                            counter++;
                                            course_counter++
                                        }
                                    }
                                }
                                else {
                                    if(Total_course != counter) {
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
                            let Total_course = CLASS_SCHEDULE[selected_dropdown][day_name].ListTime.length
                            let counter = 0
                            let course_counter = 1

                            TOTAL_TIME.ListTime.forEach(time => {
                                if(TOTAL_TIME[time]) {
                                    if(CLASS_SCHEDULE[selected_dropdown][day_name].ListTime.indexOf(time) != -1) {
                                        const course_id = CLASS_SCHEDULE[selected_dropdown][day_name][time].CourseID
                                        const course_name = GetCourseName(course_id)
                                        const teacher_id = CLASS_SCHEDULE[selected_dropdown][day_name][time].TeacherID
                                        let teacher_name = GetTeachersName(teacher_id)

                                        if(teacher_name == "-1") {
                                            teacher_name = ""
                                        }

                                        if(course_name != "-1") {
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
                                                    <span class="item_time">[` + course_counter + '] '+ time +`</span>
                                                        <span class="item_name">` + course_name + `</span>
                                                    </div>
                                                    <span class="teacher_name">`+ teacher_name + `</span>
                                                </div>
                                            </div>`

                                            counter++;
                                            course_counter++
                                        }
                                    }
                                }
                                else {
                                    if(Total_course != counter) {
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

            if(TODAYS_DATE == int_currDate) {
                day_name = "Today"
            }

            result_innerHtml += `
                <div class="schedule_date">
                        <div class="item_header">
                            <span class="item_day` + isStudying + `">` + day_name + `</span>
                            <span class="item_date">` + i + `</span>
                        </div>
                ` + schedule_data +
                        `<div class="spacer"></div>
                        </div>
                    </div>
                </div>`
        }
    }
    else {
        const target_id = GetTeachersID(selected_dropdown)
        if (target_id != "-1") {
            for (let i = 1; i <= end_day ; i++) {
                const curr_date = new Date(year, month, i)
                let day_name = GetDayNamesFromDate(curr_date)
                const int_currDate = DateToInt(curr_date)

                let isTeaching = " active"
                let schedule_data = `<div class="item_wrapper">
                                        <div class="item_container">`

                if(day_name.match("Sun") || isTheDateHoliday(int_currDate)) {
                    isTeaching = " libur"
                }
                else {
                    if(int_currDate >= START_TEMP_DATE && int_currDate <= END_TEMP_DATE) {
                        if(TEACHERS_SCHEDULE_TEMP[target_id] != null) {
                            if(TEACHERS_SCHEDULE_TEMP[target_id].ListDay.indexOf(day_name) != -1) {
                                let break_idx = 1
                                let Total_course = TEACHERS_SCHEDULE_TEMP[target_id][day_name].ListTime.length
                                let counter = 0
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

                                            if(course_name != "-1") {
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
                                                    schedule_data += `
                                                    <div class="item_schedule changes">
                                                        <div class="item_label ` + label + `"></div>
                                                        <div class="inner_item">
                                                            <div class="time_and_name">
                                                                <span class="item_time">[` + course_counter + '] '+ time +`</span>
                                                                <span class="item_name">` + course_name + `</span>
                                                            </div>
                                                            <span class="class_name">`+ class_id + `</span>
                                                        </div>
                                                    </div>`

                                                }
                                                else {
                                                    schedule_data += `
                                                    <div class="item_schedule">
                                                        <div class="item_label ` + label + `"></div>
                                                        <div class="inner_item">
                                                            <div class="time_and_name">
                                                                <span class="item_time">[` + course_counter + '] '+ time +`</span>
                                                                <span class="item_name">` + course_name + `</span>
                                                            </div>
                                                            <span class="class_name">`+ class_id + `</span>
                                                        </div>
                                                    </div>`
                                                }
                                                

                                                counter++;
                                                course_counter++
                                            }
                                        }
                                        else {
                                            schedule_data += `
                                                <div class="item_schedule">
                                                    <div class="item_label non"></div>
                                                    <div class="inner_item">
                                                        <div class="time_and_name">
                                                            <span class="item_time">[` + course_counter + '] '+ time +`</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            `
                                            course_counter++
                                        }
                                    }
                                    else {
                                        if(Total_course != counter) {
                                            schedule_data += `
                                                <div class="item_schedule">
                                                    <div class="item_label non"></div>
                                                    <div class="inner_item">
                                                        <div class="time_and_name">
                                                            <span class="item_time">[` + course_counter + '] '+ time +`</span>
                                                            <span class="item_name">Istirahat Ke-` + break_idx + `</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            `
                                            break_idx++
                                        }
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
                                let Total_course= TEACHERS_SCHEDULE[target_id][day_name].ListTime.length
                                let counter= 0
                                let course_counter = 1

                                
                                TOTAL_TIME.ListTime.forEach(time => {
                                    if(TOTAL_TIME[time]) {
                                        if(TEACHERS_SCHEDULE[target_id][day_name].ListTime.indexOf(time) != -1) {
                                            const course_id = TEACHERS_SCHEDULE[target_id][day_name][time].CourseID
                                            const course_name = GetCourseName(course_id)
                                            const class_id = TEACHERS_SCHEDULE[target_id][day_name][time].ClassID

                                            if(course_name != "-1") {
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
                                                            <span class="item_time">[` + course_counter + '] '+ time +`</span>
                                                            <span class="item_name">` + course_name + `</span>
                                                        </div>
                                                        <span class="class_name">`+ class_id + `</span>
                                                    </div>
                                                </div>`

                                                counter++;
                                                course_counter++
                                            }
                                        }
                                        else {
                                            schedule_data += `
                                                <div class="item_schedule">
                                                    <div class="item_label non"></div>
                                                    <div class="inner_item">
                                                        <div class="time_and_name">
                                                            <span class="item_time">[` + course_counter + '] '+ time +`</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            `
                                            course_counter++
                                        }
                                    }
                                    else {
                                        if(Total_course != counter) {
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

                if(TODAYS_DATE == int_currDate) {
                    day_name = "Today"
                }

                result_innerHtml += `
                    <div class="schedule_date">
                            <div class="item_header">
                                <span class="item_day` + isTeaching + `">` + day_name + `</span>
                                <span class="item_date">` + i + `</span>
                            </div>
                    ` + schedule_data +
                            `<div class="spacer"></div>
                            </div>
                        </div>
                    </div>`
            }
        }
    }

    let margin_left = parseInt((schedule_track.currentStyle || window.getComputedStyle(schedule_track)).marginLeft);

    if (isScheduleDown) {
        schedule_track.innerHTML = result_innerHtml
        nav_year_month.innerHTML = GetMonthNamesFromDate(index_date) + " " + year

        if(lock_next_prev.curr_page == 0) {
            schedule_wrapper.scrollLeft = ((schedule_track.getBoundingClientRect().width) / end_day * (TODAYS_DAY - 1)) + margin_left
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
            nav_year_month.innerHTML = GetMonthNamesFromDate(index_date) + " " + year
            if(lock_next_prev.curr_page == 0) {
                schedule_wrapper.scrollLeft = ((schedule_track.getBoundingClientRect().width) / end_day * (TODAYS_DAY - 1)) + margin_left
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
    lock_next_prev.curr_page = 0
    if(!prev_schedule.classList.contains("active")) {
        prev_schedule.classList.toggle("active")
    }
    if(!next_schedule.classList.contains("active")) {
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
            selected_dropdown = String(e.target.textContent)
            UpdateSchedule()
        })
    })
}



/**
 * ~ Start Section ~
 */
nav_year_month.innerHTML = GetMonthNamesFromDate(TODAY) + " " + TODAYS_YEAR
gsap.to(".schedule_wrapper", {top: "100%", duration: 0})

if (GetSecondsDifferent(start_time) < 10) {
  while (GetSecondsDifferent(start_time) < 10) {
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
AddDropdownSelection(teachers_name);


role_switch.addEventListener("click", () => {
    isStudent = !isStudent;
    isScheduleDown = true

    if (isStudent) {
        AddDropdownSelection(CLASS_LIST);
        dropdown_placeholder.innerHTML = "Pilih kelas";
    }
    else {
        AddDropdownSelection(teachers_name);
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
        UpdateScheduleData()
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
        UpdateScheduleData()
    }
})