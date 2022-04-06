/*
    LabelCore
    author:q6q64399(q6q64399@gmail.com)
*/
"use strict";
function LabelCore(element, labelList, data, saveCB) {
    const threshold = 5;
    const strokeWidth = 3;

    const area = element.querySelector(".label-area");
    const popup = element.querySelector(".label-popup");
    const main = element.querySelector(".label-main");
    const list = document.querySelector(".label-list ul");

    const canvas = element.querySelector("canvas");
    const img = element.querySelector("img");
    const svg = element.querySelector(".label-svg");

    const save = element.querySelector(".save");

    const button = {
        move: element.querySelector(".move"),
        select: element.querySelector(".select"),
        polygon: element.querySelector(".polygon"),
        rectangle: element.querySelector(".rectangle"),
        edit: element.querySelector(".edit"),
        delete: element.querySelector(".delete"),
        zoomin: element.querySelector(".zoomin"),
        zoomout: element.querySelector(".zoomout")
    };
    const panel = {
        save: element.querySelector(".label-save-label"),
        delete: element.querySelector(".label-delete-label"),
        label: element.querySelector(".label-label"),
        desc: element.querySelector(".label-desc")
    };
    let check = function(x, y, p) {
        return x + threshold >= p[0] && x - threshold <= p[0] && y + threshold >= p[1] && y - threshold <= p[1];
    };
    const event = {
        mousedown: function(e) {
            if (lock) {
                return;
            }
            //firefox不用转换x,y坐标，chrome和edge需要转换
            let x = e.layerX / (browserType == "Chrome" ? scaleCanvas : 1),
                y = e.layerY / (browserType == "Chrome" ? scaleCanvas : 1);
            console.log(`Mousedown (${x},${y})`);
            switch (mode) {
                case 1: //move canvas
                    keydown = true;
                    break;
                case 2: //add point
                    buttonMethod.addPoint(x, y, e.button, e.clientX, e.clientY);
                    break;
                case 3: //add rectangle start
                    keydown = true;
                    buttonMethod.rectangleInit(x, y);
                    break;
                case 4: //edit area
                    svgLock && buttonMethod.dragPoint(x, y, e.clientX, e.clientY);
                    break;
                default:
                    console.warn("Illegal mode!");
                    break;
            }
        },
        mouseup: function(e) {
            if (!keydown) {
                return;
            }
            keydown = false;
            if (mode == 3) {
                method.addArea(e.clientX, e.clientY);
            } else if (mode == 4) {
                if (!nowDrawType) {
                    let middleX = (pointList[selectPoint][0] + pointList[selectPoint - 1 < 0 ? pointList.length - 1 : selectPoint - 1][0]) / 2,
                        middleY = (pointList[selectPoint][1] + pointList[selectPoint - 1 < 0 ? pointList.length - 1 : selectPoint - 1][1]) / 2;
                    pointList.splice(selectPoint, 0, [middleX, middleY, 1]);
                    middleX = (pointList[selectPoint + 1][0] + pointList[selectPoint + 2 > pointList.length - 1 ? 0 : selectPoint + 2][0]) / 2;
                    middleY = (pointList[selectPoint + 1][1] + pointList[selectPoint + 2 > pointList.length - 1 ? 0 : selectPoint + 2][1]) / 2;
                    pointList.splice(selectPoint + 2, 0, [middleX, middleY, 1]);
                }
                method.drawArea();
            }
        },
        mousemove: function(e) {
            if (!keydown) {
                return;
            }
            //firefox不用转换x,y坐标，chrome和edge需要转换
            let x = e.layerX / (browserType == "Chrome" ? scaleCanvas : 1),
                y = e.layerY / (browserType == "Chrome" ? scaleCanvas : 1);
            switch (mode) {
                case 1: //scroll canvas
                    let left = area.scrollLeft - e.movementX,
                        top = area.scrollTop - e.movementY;
                    area.scrollTo({
                        top: top < 0 ? 0 : top,
                        left: left < 0 ? 0 : left
                    });
                    break;
                case 3: //draw rectangle
                    method.drawRectangle(x, y);
                    break;
                case 4: //edit point position
                    if (nowDrawType == 0) {
                        pointList[selectPoint][0] = x;
                        pointList[selectPoint][1] = y;
                        method.drawArea();
                    } else {
                        method.drawRectangle(x, y, selectPoint);
                    }
                    break;
                default:
                    break;
            }
        },
        wheel: function(e) {
            mode == 1 && method.zoom(e.deltaY < 0 ? 0.05 : -0.05);
        },
        clickbutton: function(t, c) {
            if (lock) {
                alert("请先完成标签编辑任务");
                return;
            }
            let e = this;
            if (typeof t == "number") {
                e = c;
            }
            if (e == button.zoomin) {
                method.zoom(0.15);
                return;
            } else if (e == button.zoomout) {
                method.zoom(-0.15);
                return;
            }

            if (
                pointList.length != 0 &&
                ((tempmode != 2 && e == button.polygon) ||
                    (tempmode != 3 && e == button.rectangle) ||
                    (tempmode != 4 && e == button.edit) ||
                    (tempmode != 0 && e == button.delete))
            ) {
                alert("请先完成当前标记区域。\n添加模式下，在起点处按下左键完成标记，在起点处按下右键撤销标记\n修改模式下，点击空白处完成修改");
                return;
            } else if (pointList.length == 0) {
                tempmode = 0;
            }
            switch (e) {
                case button.select:
                    mode = 0;
                    svgLock = tempmode == 4 ? svgLock : false;
                    break;
                case button.move:
                    mode = 1;
                    svgLock = tempmode == 4 ? svgLock : false;
                    break;
                case button.polygon:
                    [mode, tempmode, svgLock] = [2, 2, true];
                    break;
                case button.rectangle:
                    [mode, tempmode, svgLock] = [3, 3, true];
                    break;
                case button.edit:
                    svgLock = tempmode == 4 ? svgLock : false;
                    [mode, tempmode] = [4, 4, false];
                    break;
                case button.delete:
                    [mode, svgLock] = [5, false];
                    break;
                default:
                    break;
            }

            element.querySelector(".active").classList.remove("active");
            e.querySelector("li").classList.add("active");
        },
        savelabel: function() {
            method.createArea(labelList[panel.label.value].id, panel.desc.value, labelList[panel.label.value].color);
            popup.style.display = "none";
            lock = false;
            mode == 4 && (svgLock = false);
            element.focus();
        },
        deletelabel: function() {
            pointList = [];
            method.drawArea();
            popup.style.display = "none";
            lock = false;
            mode == 4 && (svgLock = false);
            element.focus();
        },
        save: function() {
            saveCB(
                areaList,
                function() {
                    alert("保存成功");
                },
                function(e) {
                    alert("保存失败：" + e ? e : "未知错误");
                }
            );
        },
        keydown: function(e) {
            if (e.target == panel.desc) {
                return;
            }
            switch (e.key) {
                case "a":
                case "A":
                    event.clickbutton(1, button.select);
                    break;
                case "w":
                case "W":
                    event.clickbutton(1, button.move);
                    break;
                case "q":
                case "Q":
                    event.clickbutton(1, button.polygon);
                    break;
                case "r":
                case "R":
                    event.clickbutton(1, button.rectangle);
                    break;
                case "e":
                case "E":
                    event.clickbutton(1, button.edit);
                    break;
                case "d":
                case "D":
                    event.clickbutton(1, button.delete);
                    break;
                case "z":
                case "Z":
                    event.clickbutton(1, button.zoomin);
                    break;
                case "x":
                case "X":
                    event.clickbutton(1, button.zoomout);
                    break;
                case "s":
                case "S":
                    if (e.ctrlKey) {
                        event.save();
                        e.preventDefault();
                    }
                    break;
                default:
                    break;
            }
        }
    };
    const buttonMethod = {
        //mode == 2; Mousedown
        addPoint: function(x, y, buttonType, clientX, clientY) {
            nowDrawType = 0;
            tempSelectId = -1;
            if (pointList.length != 0 && check(x, y, pointList[0])) {
                if (buttonType == 2) {
                    pointList = [];
                } else {
                    method.addArea(clientX, clientY);
                }
            } else {
                pointList.push([x, y, 0]);
            }
            method.drawArea();
        },
        //mode == 3; Mousedown
        rectangleInit: function(x, y) {
            nowDrawType = 1;
            tempSelectId = -1;
            for (let index = 0; index < 4; index++) {
                pointList.push([x, y, 0]);
            }
            selectPoint = 2;
        },
        //mode == 4; Mousedown
        dragPoint: function(x, y, clientX, clientY) {
            let tempSelectPoint = selectPoint;
            selectPoint = -1;
            for (const key in pointList) {
                if (check(x, y, pointList[key])) {
                    selectPoint = parseInt(key);
                    break;
                }
            }
            if (tempSelectPoint >= 0 && pointList[tempSelectPoint][2] == 1) {
                if (selectPoint != tempSelectPoint && selectPoint != tempSelectPoint + 2) {
                    if (selectPoint != -1) {
                        selectPoint =
                            selectPoint > tempSelectPoint + 1 ? selectPoint - 2 : selectPoint == tempSelectPoint + 1 ? tempSelectPoint : selectPoint;
                    }
                    pointList.splice(tempSelectPoint + 2, 1);
                    pointList.splice(tempSelectPoint, 1);
                } else if (selectPoint == tempSelectPoint) {
                    pointList.splice(tempSelectPoint + 2, 1);
                } else {
                    pointList.splice(tempSelectPoint, 1);
                    selectPoint--;
                }
            }
            if (selectPoint != -1) {
                pointList[selectPoint][2] = 0;
                keydown = true;
            } else {
                method.addArea(clientX, clientY);
            }
        }
    };
    const method = {
        drawArea: function(isDrawRectangle) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.lineWidth = strokeWidth;
            if (pointList.length != 0) {
                let mark = false;
                ctx.beginPath();
                ctx.strokeStyle = "rgba(87, 95, 207,1.0)";
                for (let point of pointList) {
                    if (mark) {
                        ctx.lineTo(point[0], point[1]);
                    } else {
                        ctx.moveTo(point[0], point[1]);
                        mark = true;
                    }
                }
                if (mode == 3 || mode == 4 || lock) {
                    ctx.lineTo(pointList[0][0], pointList[0][1]);
                }
                ctx.stroke();
                ctx.closePath();

                ctx.fillStyle = "white";
                ctx.strokeStyle = "rgba(87, 95, 207,1.0)";
                if (mode == 4) {
                    for (const point of pointList) {
                        ctx.beginPath();
                        ctx.ellipse(point[0], point[1], 2, 2, 0, 0, 2 * Math.PI);
                        ctx.stroke();
                        ctx.fill();
                        ctx.closePath();
                    }
                } else {
                    ctx.beginPath();
                    ctx.ellipse(pointList[0][0], pointList[0][1], 2, 2, 0, 0, 2 * Math.PI);
                    ctx.stroke();
                    ctx.fill();
                    ctx.closePath();
                }
                if (isDrawRectangle && keydown) {
                    ctx.strokeStyle = "#eee";
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(0, pointList[selectPoint][1]);
                    ctx.lineTo(width, pointList[selectPoint][1]);
                    ctx.stroke();
                    ctx.closePath();
                    ctx.beginPath();
                    ctx.moveTo(pointList[selectPoint][0], 0);
                    ctx.lineTo(pointList[selectPoint][0], height);
                    ctx.stroke();
                    ctx.closePath();
                }
            }
        },
        createArea: function(index, desc, color) {
            let tempList = [];
            for (const item of pointList) {
                item[2] == 0 && tempList.push(item);
            }
            areaList.push({
                id: labelList[index].id,
                index: index,
                desc: desc,
                color: color,
                type: mode == 2 || (mode == 4 && nowDrawType == 0) ? 0 : 1,
                points: tempList
            });
            let pathStr = "";
            for (let point of tempList) {
                pathStr += `${point[0]},${point[1]} `;
            }
            pointList = [];
            method.createSVGPath(pathStr, color, color + "66");
            method.drawArea();
            panel.desc.value = "";
        },
        addArea: function(x, y) {
            lock = true;
            method.updateLabelSelector(nowDrawType);
            popup.style.display = "inline";
            if (area.clientWidth < x + popup.clientWidth + 10) {
                popup.style.left = area.clientWidth - popup.clientWidth - 10 + "px";
            } else {
                popup.style.left = x + "px";
            }
            if (area.clientHeight < y + popup.clientHeight + 10) {
                popup.style.top = area.clientHeight - popup.clientHeight - 5 + "px";
            } else {
                popup.style.top = y + "px";
            }
            method.drawArea();
        },
        createSVGPath: function(pathStr, color, fillcolor) {
            let p = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            p.setAttribute("points", pathStr);
            p.setAttribute("stroke", color);
            p.setAttribute("stroke-width", strokeWidth);
            p.setAttribute("fill", "none");
            let item = areaList[areaList.length - 1];
            p.setAttribute("label", item.id);
            p.addEventListener("mouseenter", function() {
                !svgLock && p.setAttribute("fill", fillcolor);
            });
            p.addEventListener("click", function() {
                if (svgLock) {
                    return;
                }
                if (mode == 5) {
                    method.removeAreaList(item, this);
                } else if (mode == 4) {
                    nowDrawType = item.type;
                    tempSelectId = item.id;
                    pointList = item.points;
                    panel.label.value = item.index;
                    panel.desc.value = item.desc;
                    method.drawArea();
                    method.removeAreaList(item, this);
                    svgLock = true;
                }
            });
            p.addEventListener("mouseleave", function() {
                !svgLock && p.setAttribute("fill", "none");
            });
            svg.appendChild(p);
            method.updateCount(item.id, true);
        },
        removeAreaList: function(item, e) {
            for (const key in areaList) {
                if (areaList[key] == item) {
                    method.updateCount(item.id, false);
                    areaList.splice(key, 1);
                    e.remove();
                    break;
                }
            }
        },
        drawRectangle: function(x, y) {
            let pointIndex = parseInt(selectPoint);
            let pos1 = pointIndex == 2 || pointIndex == 0 ? 0 : 1;
            pointList[pointIndex + 1 > 3 ? 0 : pointIndex + 1][pos1] = pos1 == 0 ? x : y;
            pointList[pointIndex][0] = x;
            pointList[pointIndex][1] = y;
            pointList[pointIndex - 1 < 0 ? 3 : pointIndex - 1][pos1 == 0 ? 1 : 0] = pos1 == 0 ? y : x;
            method.drawArea(true);
        },
        zoom: function(r) {
            scaleCanvas += r;
            main.style.transform = `scale(${scaleCanvas})`;
        },
        updateCount: function(id, isAdd) {
            let e = document.querySelector(".label-list-count-" + id),
                v = parseInt(e.innerHTML);
            e.innerHTML = isAdd ? ++v : --v;
        },
        updateLabelSelector: function(type) {
            panel.label.innerHTML = "";
            let i = 0,
                p = 0;
            for (const key in labelList) {
                const item = labelList[key];
                if (item.type != type) {
                    continue;
                }
                let e = document.createElement("option");
                e.value = key;
                e.innerHTML = item.label;
                e.style.color = item.color;
                panel.label.appendChild(e);

                if (tempSelectId != -1 && item.id == tempSelectId) {
                    p = i;
                }
                i++;
            }
            if (p != 0) {
                panel.label.childNodes[p].selected = true;
            }
        }
    };
    //variable
    let mode = 0; //  0->select; 1->move 2->polygon 3->rectangle
    //图片原始宽高
    let width = img.naturalWidth,
        height = img.naturalHeight;
    //图片宽高比，缩放用
    let scale = width / height;
    //区域集
    let areaList = [];
    //临时点集
    let pointList = [];
    let scaleCanvas;
    //main mousedown/clickButton事件是否触发开关
    let lock = false;
    //main mouseup/mousemove事件是否触发开关
    let keydown = false;
    //svg是否触发开关
    let svgLock = true;
    //当前实际mode
    let tempmode = 0;
    //已选择的点，为mode==4时的变量
    let selectPoint = -1;
    //当前在用什么图形：Polygon：0/Rectangle：1
    let nowDrawType = 0;
    //mode==4时临时保存编辑的类型ID
    let tempSelectId = -1;
    //浏览器类型
    let browserType = navigator.userAgent.indexOf("Chrome") != -1 ? "Chrome" : "Firefox";
    //init

    //初始化宽高
    (svg.style.width = width + "px"), (svg.style.height = height + "px");
    (img.width = width), (img.height = height);
    (canvas.width = width), (canvas.height = height);
    console.log(Math.abs(area.clientHeight * scale - height) + "  " + Math.abs(area.clientWidth - width));
    scaleCanvas =
        Math.abs(area.clientHeight * scale - height) > Math.abs(area.clientWidth - width) ? area.clientHeight / height : area.clientWidth / width;
    main.style.transform = `scale(${scaleCanvas})`;

    const ctx = canvas.getContext("2d");
    main.addEventListener("mousedown", event.mousedown);
    main.addEventListener("mouseup", event.mouseup);
    main.addEventListener("mousemove", event.mousemove);
    element.addEventListener("keydown", event.keydown);
    svg.addEventListener("contextmenu", e => {
        e.preventDefault();
    });
    area.addEventListener("wheel", event.wheel);
    for (const key in button) {
        button[key].addEventListener("click", event.clickbutton);
    }
    panel.save.addEventListener("click", event.savelabel);
    panel.delete.addEventListener("click", event.deletelabel);
    save.addEventListener("click", event.save);
    //追加label
    if (labelList) {
        for (const item of labelList) {
            let e = document.createElement("div");
            e.innerHTML = `<li class="label-list-item">
                <div style="background-color:${item.color}" class="label-list-color"></div>
                <div class="label-list-title">
                    <h3>${item.label}</h3>
                    <p>Draw a ${item.type == 0 ? "polygon" : "rectangle"}</p>
                </div>
                <div class="label-list-right">
                    <span data-id="${item.id}" class="iconfont icon-kejian label-list-visible"></span>
                    <div class="label-list-count label-list-count-${item.id}">0</div>
                </div>
            </li>`;
            list.appendChild(e.childNodes[0]);
        }
        let temp = document.querySelectorAll(".label-list-visible");
        for (const item of temp) {
            item.addEventListener("click", function() {
                this.visible = this.visible || this.visible == undefined ? false : true;
                let t = document.querySelectorAll(`[label='${this.getAttribute("data-id")}']`);
                for (const ti of t) {
                    ti.style.display = this.visible ? "inline" : "none";
                }
                this.classList.remove(!this.visible ? "icon-kejian" : "icon-bukejian");
                this.classList.add(this.visible ? "icon-kejian" : "icon-bukejian");
            });
        }
    }
    //还原数据
    if (data) {
        for (const item of data) {
            pointList = item.point;
            for (const key in labelList) {
                if (labelList[key].id == item.label) {
                    method.createArea(key, item.desc, labelList[key].color);
                    break;
                }
            }
        }
    }
}
