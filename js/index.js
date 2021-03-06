	var ak = 'RNYnFjIqp5MkmcL5OWMsudNGhAqH44QL';
	var geotable_id = 183275;
	var region= 180;
	
	//自定义我的位置图标
	var myIcon = new BMap.Icon("img/address.png",new BMap.Size(20,20));
	
	// 百度地图API功能
	var map = new BMap.Map("allmap");    // 创建Map实例
	map.centerAndZoom(new BMap.Point(120.215512,30.253083), 15);  // 初始化地图,设置中心点坐标和地图级别  
	map.setCurrentCity("杭州");          // 设置地图显示的城市 此项是必须设置的
	map.enableScrollWheelZoom(true);     //开启鼠标滚轮缩放
	
	//定位控件
	map.addControl(new BMap.GeolocationControl({
 		anchor:BMAP_ANCHOR_TOP_RIGHT,
		showAddressBar : false, //是否显示    
 		enableAutoLocation : true, //首次是否进行自动定位   
		locationIcon:myIcon,
		
	}));

	
	
	
	//页面加载时开始获取当前位置
	getCurrentAddress();
	
	//地图拖拽时加载视野内数据
	map.addEventListener("dragend",getrectangleAddress)
	
	//获取当前位置
	function getCurrentAddress(){
		//获取当前地理坐标
		var geolocation = new BMap.Geolocation();
		geolocation.getCurrentPosition(function(r){
			if(this.getStatus() == BMAP_STATUS_SUCCESS){
				var mk = new BMap.Marker(r.point,{icon:myIcon});
				mk.disableMassClear();
				map.addOverlay(mk);
				map.panTo(r.point);
//				alert('您的位置：'+r.point.lng+','+r.point.lat);
				let addr =  r.point.lng+','+r.point.lat;
				getArroundAddress(addr)
			}
			else {
				alert('failed'+this.getStatus());
			}        
		},{enableHighAccuracy: true})
	}
	
	//本地检索
	function getLocalAddress(keyword){
		console.log(keyword)
		let url = 'http://api.map.baidu.com/geosearch/v3/local';
		$.ajax({
			type:"get",
			url:url,
			dataType:"jsonp",
			async:true,
			data:{
				'q': keyword, //检索关键字
                'page_index': 0,  //页码
                'region': region,  //当前城市id
                'scope': '2',  //显示详细信息
                'geotable_id': geotable_id,
                'page_size': 12,
                'ak': ak,  //用户ak
			},
			success(res){
				console.log(res);
				//搜索结果
				domPullAddr(res);
			}
		});
	}
	
	//矩形检索

	function getrectangleAddress(){
		let bs = map.getBounds();   //获取可视区域
	    let bssw = bs.getSouthWest();   //可视区域左下角
	    let bsne = bs.getNorthEast();   //可视区域右上角
//	    console.log(bssw,bsne);
	    let addr = bssw.lng + ','+ bssw.lat +';'+ bsne.lng +','+ bsne.lat
	    console.log(addr)
	    
	    let url = 'http://api.map.baidu.com/geosearch/v3/bound';
	    $.ajax({
	    	type:"get",
	    	url:url,
	    	dataType:"jsonp",
	    	async:true,
	    	data:{
				'q': '', //检索关键字
				'bounds':addr, //左下角和右上角的经纬度坐标点。2个点用;号分隔
                'page_index': 0,  //页码
                'region': region,  //当前城市id
                'scope': '2',  //显示详细信息
                'geotable_id': geotable_id,
                'page_size': 12,
                'ak': ak,  //用户ak
			},
			success(res){
				console.log(res);
//				alert(JSON.stringify(res))
				if(res.size != 0){
					map.clearOverlays();
					renderMap(res);
				}else{
					return;
				}
				
			}
	    });
	}
	
	
	//周边检索
	function getArroundAddress(addr,keyword){
		keyword = keyword || "";
		let url = "https://api.map.baidu.com/geosearch/v3/nearby";
		$.ajax({
			type:"get",
			url: url,
			dataType:"jsonp",
			async:true,
			data:{
				'location':addr,  // 当前地理坐标
				'q': keyword, //检索关键字
                'page_index': 0,  //页码
                // 'filter': filter.join('|'),  //过滤条件
                'region': region,  //当前城市id
                'scope': '2',  //显示详细信息
                'geotable_id': geotable_id,
                'page_size': 12,
                'ak': ak,  //用户ak
                'radius':5000     //半径
			},
			success(res){
				console.log(res);
//				alert(JSON.stringify(res))
				renderMap(res);
			}
		});
	}
	
	//绘制坐标
	function renderMap(res){
		var content = res.contents;
		
		if(content.length == 0){
			alert("未查询到信息");
			return;
		}
		
		$.each(content,function(i,item){
			let point = new BMap.Point(item.location[0], item.location[1]);
			let marker = new BMap.Marker(point);
//			alert(JSON.stringify(item))
			map.addOverlay(marker);
			showInfo(marker,item)
		})
	}
	
	//点击marker显示详情
	function showInfo(marker,item){
		var opts = {
				width : 250,     // 信息窗口宽度
				height: 80,     // 信息窗口高度
				title : "位置详情" , // 信息窗口标题

		   	};
		marker.addEventListener('click',function(){
            //创建检索信息窗口对象
            var point = new BMap.Point(item.location[0], item.location[1]);
//          map.panTo({center: point,opts:true})
            
        	
//         	var infoWindow = new BMap.InfoWindow(item.address, opts);  // 创建信息窗口对象 
//
//			map.openInfoWindow(infoWindow,point); //开启信息窗口
			map.panTo(point)
			

		},false)
	}
	
	
	//点击切换显示隐藏
	$(".toggle-btn").on('click',function(){
		$('.addr-list').html("")
	})
	
	//搜索
	$("#txt").on('keyup',function(e){
		if(e.keyCode == 13){
			var keyword = $('#txt').val();
			getLocalAddress(keyword);
		}
	})
	
	//本地搜索完成时要做的事情
	function domPullAddr(res){
		$('.addr-list').html("")
		let html = '';
		if(res.size == 0){
			html = `<div class="list">
						<p class="no-addr">抱歉,没有符合条件的商户,请重新搜索</p>
					</div>`;
			
		}else{
			var content = res.contents;
			content.forEach((item,index) => {
				html += `<div class="list">
						<h4>${ item.title}</h4>	
						<p>位置:${item.address}</p>
						<b style="display:none">${item.location}</b>
					</div>`;
			})
		}
		$('.addr-list').html(html)
	}
	
	//点击搜索列表时
	$('.addr-list').on('click','.list',function(){
		$(this).siblings().hide();
		console.log($(this).children('b').html())
		var arr = $(this).children('b').html().split(',')
		//创建坐标
		var currentPoint = new BMap.Point(arr[0],arr[1]);
		//创建当前标注
		var currentMarker = new BMap.Marker(currentPoint);
		//移除其他标注
		map.clearOverlays();
		//绘制当前标注
		map.addOverlay(currentMarker);
		//移动到当前标注
		map.panTo(currentPoint);
	})
	
	


	
	

//	//地址批量转换为坐标
//	function addrToPoint(addr){
//		var index = 0;
//		
//		var myGeo = new BMap.Geocoder();
//		setInterval(() => {
//			if(index < addr.length){
//				var lat = "";
//				var lng = "";
//				var txts = ''
////				console.log(index)
//	
//				myGeo.getPoint(addr[index], function(point){
//					console.log(index)
//					if (point) {
//						lat=point.lat;
//						lng=point.lng;
//						txts = "<tr><td>"+ addr[index] +"</td><td>"+ lat +"</td><td>"+ lng +"</td></tr>"
//						$("#table").append(txts);
//						index++;
//					}else{
//						alert("您选择地址没有解析到结果!");
//	//					addrArr.push("暂无地址");
//						lat=0;
//						lng=0;
//						txts = "<tr><td>"+ addr[index] +"</td><td>"+ lat +"</td><td>"+ lng +"</td></tr>"
//						$("#table").append(txts);
//						index++;
//					}
//					
//				}, "浙江省");
//				
////				txts = "<tr><td>"+ addr[index] +"</td><td>"+ lat +"</td><td>"+ lng +"</td></tr>"
////				$("#table").append(txts);
//				
//			}
//			
//		},400)
//
//	}
//	
////	添加到表格
//	function appendToTable(lat,lng){
//		
//		var txt = ""
//		for(var i = 0; i < lat.length; i++){
//			txt += "<tr><td>"+ lat[i] +"</td><td>"+ lng[i] +"</td></tr>"
//
//		}
//		console.log(txt)
//		$("#table").html(txt)
//	}
//	
//	
//
//	$.ajax({
//		type:"get",
//		url:"js/address2.js",
//		async:true,
//		success(res){
////			console.log(res)
//			var ss = res.split('`')
//			var s = ss[1].split("rrr")
//			console.log(s);
//			addrToPoint(s);
//			
//		}
//	});
	
	