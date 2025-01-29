

var rootAfterStyle = document.createElement('style');
function menu(n){
    if(n.style.display=="none") {
        m1.style.display='none';
        m2.style.display='none';
        m3.style.display='none';
        m4.style.display='none';
        n.style.display='block';
        if(n==plain){
        body.style.filter='blur(10px)'
    }
    } else {
        n.style.display = 'none';
        if(n==plain) {
        body.style.filter='blur(0px)'
    }
            
    }
     
    if(n==m1){
        if(n.style.display=="block"){
            rootAfterStyle.innerHTML = `.d1::after {
            transform: rotate(135deg) translateY(-270%)!important;
        }`;}  else { rootAfterStyle.innerHTML = `.d1::after {
        transform: rotate(-45deg) translateY(180%)!important;
    }`;

        }
        document.head.appendChild(rootAfterStyle);
    }
    if(n==m2){
        if(n.style.display=="block"){
            rootAfterStyle.innerHTML = `.d2::after {
            transform: rotate(135deg) translateY(-270%)!important;
        }`;}  else { rootAfterStyle.innerHTML = `.d2::after {
        transform: rotate(-45deg) translateY(180%)!important;
    }`;

        }
        document.head.appendChild(rootAfterStyle);
    }
    if(n==m3){
        if(n.style.display=="block"){
            rootAfterStyle.innerHTML = `.d3::after {
            transform: rotate(135deg) translateY(-270%)!important;
        }`;}  else { rootAfterStyle.innerHTML = `.d3::after {
        transform: rotate(-45deg) translateY(180%)!important;
    }`;

        }
        document.head.appendChild(rootAfterStyle);
    }
    if(n==m4){
        if(n.style.display=="block"){
            rootAfterStyle.innerHTML = `.d4::after {
            transform: rotate(135deg) translateY(-270%)!important;
        }`;}  else { rootAfterStyle.innerHTML = `.d4::after {
        transform: rotate(-45deg) translateY(180%)!important;
    }`;

        }
        document.head.appendChild(rootAfterStyle);
    }
}
        const today = new Date();
        var year = today.getFullYear();
        var month = today.getMonth() +1;
        var date = today.getDate() ;
        var str_year = String(year)
        var str_month = String(month).padStart(2, '0')
        var str_date = String(date).padStart(2, '0')

        console.log(str_year + str_month + str_date)
    function setdate(){
    var set = document.getElementById('date').value;
    str_year = set.substring(0, 4);
    str_month = set.substring(5, 7);
    str_date = set.substring(8, 10);
    year = Number(str_year)
    month = Number(str_month)
    date = Number(str_date)
    console.log(str_year+str_month+str_date);
    document.querySelector("#container").innerHTML = "급식 정보가 없습니다."
    fetch("https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=dba1fc9266654cf5921022efad652d33&Type=json&pIndex=1&pSize=100&ATPT_OFCDC_SC_CODE=B10&SD_SCHUL_CODE=7041169&MLSV_YMD=" + str_year + str_month + str_date)

    .then((response) => response.json())
    
    .then((data) => {

      // let spl = str.substring(str.indexOf('"DDISH_NM":"'), str.indexOf('","ORPLC_INFO"'));

      var str = JSON.stringify(data.mealServiceDietInfo[1].row[0].DDISH_NM);
      var re = str.replace(/"/g, '');
      var fe = str.substring(str.indexOf("("), str.indexOf(")") + 1);
      
      String.prototype.replaceAll = function(org, dest) {
return this.split(org).join(dest);
}
    var me = re.replaceAll(fe, '')
    document.querySelector("#container").innerHTML = me
    
      console.log(me)
      
  }).catch((error) => {
      console.error('Error:', error)
      });
      document.querySelector("#dat").innerHTML = String(year) + '년 ' + String(month) + '월 ' + String(date) + '일';
}
        fetch("https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=dba1fc9266654cf5921022efad652d33&Type=json&pIndex=1&pSize=100&ATPT_OFCDC_SC_CODE=B10&SD_SCHUL_CODE=7041169&MLSV_YMD=" + str_year + str_month + str_date)

          .then((response) => response.json())
          
          .then((data) => {

            // let spl = str.substring(str.indexOf('"DDISH_NM":"'), str.indexOf('","ORPLC_INFO"'));

            var str = JSON.stringify(data.mealServiceDietInfo[1].row[0].DDISH_NM);
            var re = str.replace(/"/g, '');
            var fe = str.substring(str.indexOf("("), str.indexOf(")") + 1);
            
            String.prototype.replaceAll = function(org, dest) {
	return this.split(org).join(dest);
}
          var me = re.replaceAll(fe, '')
          document.querySelector("#container").innerHTML = me
          
            console.log(me)
            
        }).catch((error) => {
            console.error('Error:', error)
            });

