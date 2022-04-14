// 频繁发起ajax请求 所以做get请求包装
// 搜素/获取音乐链接的时候发一次
// 通过ajax来获取
// 模块化开发
// 状态化处理 


// 搜索
// var xhr =new XMLHttpRequest()
// xhr.open('get','http://localhost:3000/search?keywords=嘴巴嘟嘟',true)
// xhr.send()
// xhr.onreadystatechange=function(){
//     if(xhr.status==200&&xhr.readyState==4){
//         // 获取成功的结果
//         console.log(JSON.parse(xhr.response))
//         // 返回的结果是一个JSON的字符串
//         // 怎么处理JSON格式的字符串
//         // 变成JS对象数据类型方便我们使用
//         // 获取音乐名字
//         var result=JSON.parse(xhr.response)
//         var songs= result.result.songs
//         console.log(songs)
//         // 放歌
//         var firstSongId=songs[0].Id
//         xhr.open('get','http://localhost:3000/song/url?id='+firstSongId,true)
//         xhr.send()
//     }

// get请求包装 把ajax包装成get方法
var get = function (url, data, callback) {
    var xhr = new XMLHttpRequest()
    var param = '?'
    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            param += key + '=' + data[key] + '&'
        }
    }
    // slice(0,length-1)方法去掉最后一位 从0留到第length-1个字符
    param = param.slice(0, param.length - 1)

    // http://localhost:3000/song/url?id=123456 要这样的形式  ?id=123456
    xhr.open('GET', url + param, true)
    xhr.send()
    xhr.onreadystatechange = function () {
        if (xhr.status == 200 && xhr.readyState == 4) {
            if (callback) {
                callback(JSON.parse(xhr.response))
            }
        }
    }
}

// 搜索封装 第二层包装：包装一些常用的方法
// 我们希望这样去调用
// 建立一个搜索函数
var search = function (keywords, callback) {
    get('http://localhost:3000/search', {
        keywords: keywords
    }, function (res) {
        if (callback) {
            // 歌在res的result的songs里 此时的res为get()里的callback()里的JSON.parse(xhr.response)
            callback(res.result.songs)

        }
    })
}
// 播放封装 获取url封装
var getSongUrl = function (id, callback) {
    get('http://localhost:3000/song/url', {
        id: id
    }, function (res) {
        if (callback) {
            // 音乐播放链接
            callback(res.data[0].url)
        }
    })
}


// 获取歌词
var getLrc = function (id, callback) {
    get('http://localhost:3000/lyric', {
        id: id
    }, function (res) {
        // console.log(res)
        var lrcString = res.lrc.lyric
        if (callback) {
            callback(lrcString)
        }
    })
}

var audio = document.getElementById('audio')
// 做一个li点击事件方法
var addEventListener = function () {
    var songs = document.getElementsByClassName('songs')
    for (var i = 0; i < songs.length; i++) {
        songs[i].addEventListener('click', function () {
            // getAttribute
            var id = this.getAttribute('data-id')
            // 通过getSongUrl方法来播放音乐
            getSongUrl(id, function (url) {
                // 通过获取audio来播放音乐 通过src来播放
                audio.src = url
                // 与视频一样play（）开始播放
                audio.play()
                // 应该只关心另外一个函数给我们提供的功能，而不参与他的实现
                // 模块化开发   屁大点事也要写个函数
                closeSearchList()
                // searchList.className='search-list'
            })
            // 展示歌词
            getLrc(id, function (res) {
                var lrc = parseLrc(res)
                console.log(lrc)
                fillLrc(lrc)
            })
            // 清空歌词
            var lrcWarp = document.getElementById('lrc-warp')
            if(lrcWarp){
                lrcWarp.innerHTML=''
            }
        })
    }
}

// 获取搜索结果  渲染搜索列表 参数为key
// 获取列表元素 为后来改classname做准备 改classname让列表展现
var searchList = document.getElementsByClassName('search-list')[0]
var resultList = document.getElementById('result-list')
var renderSearchList = function (key) {
    search(key, function (res) {
        console.log(res)
        // 模板       class方便点击事件  data-id为了存储歌曲id
        var tpl = '<li class="songs" data-id="{--id--}">' +
            '<h3>{--name--}</h3>' +
            '<h5><span>{--geshou--}</span> - 专辑：<span>{--zhuanji--}</span></h5>' +
            '<hr>' +
            '</li>'
        var html = ''
        for (var i = 0; i < res.length; i++) {
            html += tpl.replace('{--name--}', res[i].name)
                .replace('{--geshou--}', res[i].artists[0].name)
                .replace('{--zhuanji--}', res[i].album.name)
                .replace("{--id--}", res[i].id)
        }
        resultList.innerHTML = html
        openSearchList()
        // 不要在一个方法构造实现另一个方法
        // searchList.className='search-list active'
        addEventListener()
    })
}

// 构造打开列表关闭列表方法 用的时候调用就好了
var closeSearchList = function () {
    searchList.className = 'search-list'
}
var openSearchList = function () {
    searchList.className = 'search-list active'
}

// 点击按钮 获取Input里的输入值
var searchButton = document.getElementById('search-button')
var keywordInput = document.getElementById('keyword')

searchButton.addEventListener('click', function () {
    var value = keywordInput.value
    // 将input的输入值代入renderSearchList函数里
    renderSearchList(value)
    
})



// 歌词滚动
var index = 0
// 初始距离
var marginTop=240
var nowLrcObject = []
// 只有在解析歌词的时候使用
// 只在这个功能内部使用
// 对比歌词
var compareLrc = function () {
    // 在html中获取全部的歌词
    var lrcItem = document.getElementsByClassName('lrc-item')
    // 对比时间，确定那一句歌词播放
    if (nowLrcObject[index].time - audio.currentTime * 1000 < 300) {
        lrcItem[index].style.color = 'red'
        // 歌词向上移动20px
        marginTop-=20
        lrcWarp.style.marginTop=marginTop+'px'
        lrcItem[index].style.fontSize = '1.2em'
        // 将上一句的高亮去掉
        if(index-1>-1){
            lrcItem[index-1].style.color = ''
            lrcItem[index-1].style.fontSize = ''
        }
        index++
    }

}
// 在这里timeupdate对比
audio.addEventListener('timeupdate', function () {
    compareLrc()
})


// 模板
var tpl = '<li class="lrc-item">{--content--}</li>'
// 歌词填充
var lrcWarp = document.getElementById('lrc-warp')
var fillLrc = function (lrcObjArr) {
    var html = ''
    for (var i = 0; i < lrcObjArr.length; i++) {
        html += tpl.replace('{--content--}', lrcObjArr[i].content)
    }
    lrcWarp.innerHTML = html
    nowLrcObject = lrcObjArr
}


// 歌词   // [03:06.466]晚星就像你的眼睛杀人又放火\n
var parseLrc = function (lrcString) {
    // 将时间字符串类型转化为number类型 做函数
    var parseTime = function (timeString) {
        // 切割分钟和秒 会分为俩项
        var timeStringArr = timeString.split(':') //["01","51.73"]
        var min = parseInt(timeStringArr[0]) //01
        var s = parseFloat(timeStringArr[1]) //51.73
        var totalTime = (min * 60 + s) * 1000
        return parseInt(totalTime)
    }

    var lrcArr = []
    // 通过split()方法来用'\n'分割歌词
    lrcArr = lrcString.split('\n')
    //把每一行存储时间和内容
    var lrcObjArr = []
    // 遍历 通过split()方法来用']'分割歌词内容与事件
    for (var i = 0; i < lrcArr.length; i++) {
        var lines = lrcArr[i].split(']')
        //提取时间，通过把 [03:06.466 的  [  用slice()给切割  得到03:06.466   slice(1,lines[0].length从1开始切(保留)到length最后 仍掉数组[0]
        var time = parseTime(lines[0].slice(1, lines[0].length))
        // 内容
        var content = lines[1]
        // console.log(time, content)
        // console.log(lines,time)
        //错误处理 如果某一行解析不对直接跳过这一行     //continue在foreach()里用不了
        if (content == undefined || isNaN(time)) {
            continue
        }
        lrcObjArr.push({
            // 因为要把字符串时间转化为数组类型，所以在这里就处理了
            time: time,
            content: content
        })
    };
    // console.log(lrcObjArr)
    return lrcObjArr
    

}
// var lrc
// getLrc(1430319727, function (res) {
//     // console.log(res)
//     // lrc=res
//     // var 个krc接受下解析后的歌词
//     var lrc = parseLrc(res)
//     console.log(lrc)
//     fillLrc(lrc)
// })

// [03:06.466]晚星就像你的眼睛杀人又放火\n
// 把字符串转化为数组
// 需要的格式 把字符串准换为对象格式
// {
// time:186.466,
// content:'晚星就像你的眼睛杀人又放火'
// }

// 搜索一首歌然后把结果的第一首歌放出来
// search('漠河舞厅',function(res){
//     console.log(res)
//     console.log(res[5].id)
//     var firstSongsId=res[5].id
//     getSongUrl(firstSongsId,function(res){
//         console.log(res)
//         var url=res.data[0].url
//         // 获取元素 通过src来播放
//         document.getElementById('audio').src=url
//     })
// })

// 实现一个搜索框，能获取搜索结果
// 可以点选

// 点击放歌
// 监听点击事件》播放音乐》收回搜索框