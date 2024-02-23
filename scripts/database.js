// Change "DATABASE_URL" to your "Setup Website in Google Spreadsheets" Link
export const DATABASE_URL = "https://docs.google.com/spreadsheets/d/1ebjQ6gK-swUJmQnl7QK--cnEToKhHwQa/edit?usp=sharing&ouid=116890938353425786430&rtpof=true&sd=true"



/** 

  ~ Function Area ~

*/

// Function to get Google Drive ID
export function GetGDID(GD_Url) {
    return GD_Url.split("/d/")[1].split("/")[0]
}

export function GetData(GD_ID, SS_Title, SS_Range, isGetValue=true) {
    const FULL_URL = ("https://docs.google.com/spreadsheets/d/" + GD_ID + "/gviz/tq?sheet=" + SS_Title + "&range=" + SS_Range)
    
    return fetch(FULL_URL)
    .then(res => res.text())
    .then(rep => {
        const data = (JSON.parse(rep.substring(47).slice(0,-2))).table.rows
        let result = new Array(data.length)
        for(let i = 0; i < data.length; i++) {
            let temp = new Array(data[i].c.length)
            for (let j = 0; j < data[i].c.length; j++) {
                if (data[i].c[j] != null) {
                    if(isGetValue) {
                        temp[j] = data[i].c[j].v
                    }
                    else {
                        temp[j] = data[i].c[j].f
                    }
                }
            }
            result[i] = temp
        }
        return result
    })
}