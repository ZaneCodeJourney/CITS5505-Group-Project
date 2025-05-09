// 潜水日志处理脚本
document.addEventListener('DOMContentLoaded', function() {
    // 保存潜水日志按钮点击事件
    const saveDiveBtn = document.getElementById('saveDiveBtn');
    if (saveDiveBtn) {
        saveDiveBtn.addEventListener('click', saveDiveLog);
    }
});

// 保存潜水日志
async function saveDiveLog() {
    try {
        // 获取表单数据
        const diveNumber = document.getElementById('diveNumber').value;
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        const maxDepth = document.getElementById('maxDepth').value;
        const weightBelt = document.getElementById('weightBelt').value;
        const visibility = document.getElementById('visibility').value;
        const weather = document.getElementById('weather').value;
        const location = document.getElementById('location').value;
        const divePartner = document.getElementById('divePartner').value;
        const media = document.getElementById('media').value;
        const notes = document.getElementById('notes').value;
        
        // 装备字段
        const suitType = document.getElementById('suitType').value;
        const suitThickness = document.getElementById('suitThickness').value;
        const weight = document.getElementById('weight').value;
        const tankType = document.getElementById('tankType').value;
        const tankSize = document.getElementById('tankSize').value;
        const gasMix = document.getElementById('gasMix').value;
        const o2Percentage = document.getElementById('o2Percentage').value;

        // 验证必填字段
        if (!startTime || !endTime || !maxDepth || !location) {
            alert('请填写所有必填字段');
            return;
        }

        // 准备发送的数据
        const diveData = {
            user_id: parseInt(document.body.dataset.userId || 1),
            dive_number: parseInt(diveNumber),
            start_time: startTime,
            end_time: endTime,
            max_depth: parseFloat(maxDepth),
            location: location
        };

        // 添加可选字段
        if (weightBelt) diveData.weight_belt = weightBelt;
        if (visibility) diveData.visibility = visibility;
        if (weather) diveData.weather = weather;
        if (divePartner) diveData.dive_partner = divePartner;
        if (media) diveData.media = media;
        if (notes) diveData.notes = notes;
        
        // 添加装备字段
        if (suitType) diveData.suit_type = suitType;
        if (suitThickness) diveData.suit_thickness = parseFloat(suitThickness);
        if (weight) diveData.weight = parseFloat(weight);
        if (tankType) diveData.tank_type = tankType;
        if (tankSize) diveData.tank_size = parseFloat(tankSize);
        if (gasMix) diveData.gas_mix = gasMix;
        if (o2Percentage) diveData.o2_percentage = parseFloat(o2Percentage);

        console.log('Submitting dive data:', diveData);

        // 发送请求到后端API
        const response = await fetch('/dives/api/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(diveData)
        });

        // 处理响应
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log('Dive log created successfully:', result);

        // 关闭模态框并重新加载页面
        const modal = bootstrap.Modal.getInstance(document.getElementById('addDiveModal'));
        modal.hide();
        
        // 显示成功消息并刷新页面
        alert('潜水日志添加成功！');
        window.location.reload();
    } catch (error) {
        console.error('添加潜水日志时出错:', error);
        alert(`添加潜水日志时出错: ${error.message}`);
    }
} 