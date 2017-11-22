/*
* @Author: 联想
* @Date:   2017-11-21 15:41:37
* @Last Modified by:   联想
* @Last Modified time: 2017-11-22 11:15:44
*/

'use strict';

const express = require('express')
//解析post请求体数据
const bodyParser = require('body-parser')
// 文件功能增强的包
const fse = require('fs-extra')
// 解析上传文件的包
const formidable = require('formidable')
//引入path核心对象
const path = require('path')
//引入数据库
const mysql = require('mysql')
const pool = mysql.createPool({
    connectionLimit: 10,
    host: '127.0.0.1',
    user: 'root',
    password: 'pengxungang',
    database: 'album'
});

// 创建服务器
let app = express()
// 配置模板引擎
app.engine('html',require('express-art-template'))
// 配置路由规则
 let router = express.Router()
// 测试路由
// router.get('/text',(req,res,next)=>{
// 	pool.getConnection(function(err,connection) {
// 		connection.query('SELECT * FROM album_dir',function(error,results,fields) {
// 			connection.release()
// 			if (err) throw err

// 			res.render('text.html', {
// 				text:results[0].dir
// 			})
// 		})
// 	})
// })
.get('/',(req,res,next)=>{
	// 获取链接
	pool.getConnection((err,connection)=> {
		if(err) return next(err)
		connection.query('select * from album_dir', (error,results)=> {
			connection.release()
			if(err) return next(err)
				res.render('index.html', {

					album:results
				})
		})
	})
})

// 显示照片列表
.get('/showDir',(req,res,next)=>{
	//获取url上的查询字符串
	let dirname = req.query.dir;
	// console.log(dirname)
	pool.getConnection((err,connection)=> {
			if(err) return next(err);
		connection.query('select * from album_file where dir =?',[dirname],(error,results)=> {
			//查询完毕以后，释放连接
            connection.release();
            //处理查询时带来的异常，比如表名错误
            if(err) return next(err);
            // 记录相册名
            res.render('album.html', {
            	album:results,
            	dir:dirname,
            })
		})
	})		
})
//添加目录
.post('/addDir',(req,res,next)=> {
	let dirname = req.body.dirname
	console.log(dirname);
	pool.getConnection((err,connection)=> {
		if(err) return next(err)
		connection.query('insert into album_dir values (?)',[dirname],(error,results)=>{
			//查询完毕以后，释放连接
            connection.release();
            //处理查询时带来的异常，比如表名错误
            if(err) return next(err);
            res.redirect('/showDir?dir='+ dirname);
		})
	})
})
// 添加照片
.post('/addPic',(req,res,next)=> {
	var form = new formidable.IncomingForm()

	let rootPath = path.join(__dirname,'resource')
	// 设置默认上传文件
	form.uploadDir = rootPath
	form.parse(req,function(err,fields,files) {
		// if (err) return next(err)
		// // 移动文件
  //       console.log(fields); //将字符串数据封装成对象 { dir: 'love' }
  //       // 通过移动resource下的资源到指定文件夹目录
  //       fse.move(rootPath)
  //       console.log(path.parse(files.pic.path).base);
  //       console.log(files); // 是一个对象.pic也是一个对象
   	let filename = path.parse(files.pic.path).base

   	let dist = path.join(rootPath,fields.dir,filename)
   	// 移动文件
   	fse.move(files.pic.path,dist,(err)=> {
   		if (err) return next(err)
   			// console.log('移动成功')
   		// 将数据保存到数据库
   		let bd_file = `/resource/${fields.dir}/${filename}`
   		let bd_dir = fields.dir

   		pool.getConnection((err,connection)=> {
   			if (err) return next(err)
   			connection.query('insert into album_file values (?,?)',[bd_file,bd_dir],(error,results)=>{
   				//查询完毕以后，释放连接
            connection.release();
            //处理查询时带来的异常，比如表名错误
            if(err) return next(err);
            // 重定向
            res.redirect('/showDir?dir='+bd_dir)
   			})
   		})
   	})
	})
})


// 静态资源处理
app.use('/public',express.static('./public'))
// 向外暴露照片静态资源目录
app.use('/resource',express.static('./resource'))
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());
// 中间件执行列表
app.use(router)
//错误处理中间件
app.use((err,req,res,next)=> {
	console.log('出错啦.-------------------------')
	console.log(err)
	console.log('出错啦.-------------------------')
	res.send(`
			 您要访问的页面出异常拉...请稍后再试..
            <a href="/">去首页玩</a>

		`)
})
// 监听
app.listen(8888,()=>{
	console.log('服务开启啦')
})