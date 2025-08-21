window.jsPDF = window.jspdf.jsPDF;

// Font Size
const font_size_day = 120
const font_size_date = 80
const font_size_time = 80
const font_size_course = 70
let font_size_name = 50

const font_size_title = 200
const font_size_sub_title = 120
const font_size_date_range = 100

// margin in MM
const margin_top = 20
const margin_left = 20

// Ratio & Size in mm
const size = 30
const ratio_height_time = 3
const ratio_height_schedule = 4.5
const ratio_width_time_course = 8.5
const ratio_width_schedule = 10

const height_time = (ratio_height_time * size)
const height_schedule = (ratio_height_schedule * size)
const width_schedule = (ratio_width_schedule * size)
const width_time_course = (ratio_width_time_course * size)


// Text positioning
let textHeight = 0
let textX = 0
let textY = 0

function DateIntToString(dateInt, spacer="/") {
    const year = parseInt(dateInt / 10000)
    const month = parseInt(dateInt / 100 % 100)
    const day = parseInt(dateInt % 100)
    return (day + spacer + month + spacer + year)
}

function file_name_maker(file_name) {
    const limiter = ["<", ">", ":", "\"", "/", "\\", "|", "?", "*"]

    limiter.forEach(target => {
        if(file_name.indexOf(target) != -1) {
            const regex = new RegExp(target, "g");
            file_name = file_name.replace(regex, "_");
        }
    })

    return file_name
}

export function GeneratePDFSchedule(schedule_list) {
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [2000, 2100]
    })

    let file_name = "Jadwal " + schedule_list.PDFTitle

    doc.addImage('../asset/logo.png', 'png', (2100 - margin_left - 150), margin_top + 10, 130.4, 150, "", 'SLOW', 0);

    //Generate Day Row
    const DAY_INDO = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
    let start_margin_top = margin_top
    let start_margin_left = margin_left

    if(schedule_list.PDFTitle.indexOf("Kelas") != -1) {
        doc.setFont("helvetica", "bold")
        doc.setFontSize(font_size_title)
        textHeight = doc.internal.getFontSize() / doc.internal.scaleFactor
        textX = start_margin_left + (4 * doc.internal.scaleFactor)
        textY = start_margin_top + textHeight + 10
        doc.text("Jadwal " + schedule_list.PDFTitle, textX, textY)
        start_margin_top = textY + (5 * doc.internal.scaleFactor)

        font_size_name = 50
    }
    else {
        doc.setFont("helvetica", "normal")
        doc.setFontSize(80)
        textHeight = doc.internal.getFontSize() / doc.internal.scaleFactor
        textX = start_margin_left + (4 * doc.internal.scaleFactor)
        textY = start_margin_top + textHeight + 10
        doc.text("Jadwal Guru", textX, textY)
        start_margin_top = textY

        doc.setFont("helvetica", "bold")
        doc.setFontSize(font_size_sub_title)
        let teacher_name = doc.splitTextToSize(schedule_list.PDFTitle, (doc.internal.pageSize.getWidth() - (4 * doc.internal.scaleFactor)))
        textHeight = doc.internal.getFontSize() / doc.internal.scaleFactor * teacher_name.length
        textX = start_margin_left + (4 * doc.internal.scaleFactor)
        textY = start_margin_top + textHeight + 10
        doc.text(teacher_name, textX, textY)
        start_margin_top = textY + (5 * doc.internal.scaleFactor)

        font_size_name = 60
    }
    doc.setFont("helvetica", "normal")
    doc.setFontSize(font_size_date_range)
    textHeight = doc.internal.getFontSize() / doc.internal.scaleFactor
    textX = start_margin_left + (4 * doc.internal.scaleFactor)
    textY = start_margin_top + textHeight + 10
    if (schedule_list.isScheduleChange) {
        doc.text(DateIntToString(schedule_list.ListDate[0]) + " hingga " + DateIntToString(schedule_list.ListDate[(schedule_list.ListDate.length - 1)]), textX, textY)
    }
    else {
        doc.text(("Tahun Ajaran " + schedule_list.Year + " Semester " + schedule_list.Semester), textX, textY)
    }
    
    start_margin_top = textY + (30 * doc.internal.scaleFactor)
    start_margin_left = margin_left + width_time_course

    for (let i = 0; i < schedule_list.ListDate.length; i++) {
        doc.setFillColor(64, 136, 237)
        doc.rect(start_margin_left, start_margin_top, width_schedule, height_time, "F")
        doc.setFillColor(0, 0, 0)
        doc.rect(start_margin_left, start_margin_top, width_schedule, height_time)

        // Day
        doc.setFont("helvetica", "bold")
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(font_size_day)
        textHeight = doc.internal.getFontSize() / doc.internal.scaleFactor
        textX = start_margin_left + (4 * doc.internal.scaleFactor)
        textY = start_margin_top + textHeight + 2
        doc.text(DAY_INDO[i], textX, textY)

        // Date
        if (schedule_list.isScheduleChange) {
            let date_format = DateIntToString(schedule_list.ListDate[i])
            doc.setFont("helvetica", "normal")
            doc.setTextColor(31, 31, 31)
            doc.setFontSize(font_size_date)
            textHeight = doc.internal.getFontSize() / doc.internal.scaleFactor
            textX = start_margin_left + (4 * doc.internal.scaleFactor)
            textY += textHeight + 4
            doc.text(date_format, textX, textY)
        }

        start_margin_left += width_schedule
    }

    start_margin_top = start_margin_top + height_time
    let i = 1
    let break_counter = 1
    schedule_list.time.ListTime.forEach(time => {
        start_margin_left = margin_left

        // Time label
        let time_course = time
        if(schedule_list.time[time]) {
            doc.setFillColor(148, 204, 69)
            doc.rect(start_margin_left, start_margin_top, width_time_course, height_schedule, "F")
            doc.setTextColor(0, 0, 0)

            time_course = "[" + i + "] " + time_course
            i++
        }
        else {
            doc.setFillColor(0, 0, 0)
            doc.rect(start_margin_left, start_margin_top, width_time_course, height_schedule, "F")
            doc.setTextColor(255, 255, 255)
        }

        doc.setFillColor(0, 0, 0)
        doc.rect(start_margin_left, start_margin_top, width_time_course, height_schedule)

        doc.setFont("helvetica", "bold")
        doc.setFontSize(font_size_time)
        textHeight = doc.internal.getFontSize() / doc.internal.scaleFactor
        textX = start_margin_left + (4 * doc.internal.scaleFactor)
        textY = start_margin_top + ((height_schedule - textHeight) / 2) + (doc.internal.getFontSize() * 0.3)
        doc.text(time_course, textX, textY)


        start_margin_left += width_time_course

        schedule_list.ListDay.forEach(day => {
            if (schedule_list[day][time].indexOf("</holiday/>") != -1) {
                doc.setFillColor(237, 0, 0)
                doc.rect(start_margin_left, start_margin_top, width_schedule, height_schedule, "F")
                doc.setTextColor(0, 0, 0)
            }
            else if (schedule_list[day][time].indexOf("</break time/>") != -1) {
                doc.setFillColor(0, 0, 0)
                doc.rect(start_margin_left, start_margin_top, width_schedule, height_schedule, "F")
                doc.setTextColor(0, 0, 0)

                if(day.indexOf(schedule_list.ListDay[(schedule_list.ListDay.length - 1)]) != -1) {
                    doc.setFont("helvetica", "bold")
                    doc.setFontSize(font_size_title)
                    doc.setTextColor(255, 255, 255)
                    textHeight = doc.internal.getFontSize() / doc.internal.scaleFactor
                    textX = margin_left + width_time_course + (width_schedule * 2.25) + (4 * doc.internal.scaleFactor)
                    textY = start_margin_top + ((height_schedule - textHeight) / 2) + (doc.internal.getFontSize() * 0.3)
                    doc.text("Istirahat Ke-" + break_counter, textX, textY)
                    break_counter ++
                }
            }
            else {
                if(schedule_list[day][time].indexOf("</changes/>") != -1) {
                    doc.setFillColor(236, 204, 0)
                    doc.rect(start_margin_left, start_margin_top, width_schedule, height_schedule, "F")
                    doc.setTextColor(0, 0, 0)
                    schedule_list[day][time] = schedule_list[day][time].replace("</changes/> ", "")
                }
                if(schedule_list[day][time] != "") {
                    const data = schedule_list[day][time].split(" </spacer/> ")
                    
                    doc.setFillColor(0, 0, 0)
                    doc.setFont("helvetica", "bold")
                    doc.setFontSize(font_size_course)
                    const course_name = doc.splitTextToSize(data[0], (width_schedule - (4 * doc.internal.scaleFactor)))
                    textHeight = doc.internal.getFontSize() / doc.internal.scaleFactor
                    textX = start_margin_left + (4 * doc.internal.scaleFactor)
                    textY = start_margin_top + textHeight + (2 * doc.internal.scaleFactor)
                    doc.text(course_name, textX, textY)

                    doc.setFillColor(31, 31, 31)
                    doc.setFont("helvetica", "normal")
                    doc.setFontSize(font_size_name)
                    const name = doc.splitTextToSize(data[1], (width_schedule - (4 * doc.internal.scaleFactor)))
                    textHeight = doc.internal.getFontSize() / doc.internal.scaleFactor * name.length
                    textX = start_margin_left + (4 * doc.internal.scaleFactor)
                    textY = start_margin_top + height_schedule - textHeight - 2
                    doc.text(name, textX, textY)
                }
            }

            doc.setFillColor(0, 0, 0)
            doc.rect(start_margin_left, start_margin_top, width_schedule, height_schedule)
            start_margin_left += width_schedule
        })

        start_margin_top += height_schedule
    })
    
    if (schedule_list.isScheduleChange) {
        file_name += "_" + schedule_list.ListDate[0] + "_" + schedule_list.ListDate[(schedule_list.ListDate.length - 1)]
    }
    else {
        file_name += "_" + schedule_list.Year + "_Semester_" + schedule_list.Semester
    }
    file_name = file_name_maker(file_name)
    doc.save(file_name + ".pdf");
}