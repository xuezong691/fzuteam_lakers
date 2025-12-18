// test-team-native.js

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// 读取 team.js 内容
const teamJsPath = path.resolve(__dirname, './code/static/team.js');
const teamJsCode = fs.readFileSync(teamJsPath, 'utf8');

// 创建虚拟 DOM 环境
const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
    <body>
      <div id="memberBoard"></div>
    </body>
  </html>
`, { runScripts: 'dangerously' });

const window = dom.window;
const document = window.document;

// 模拟全局函数（根据你 team.js 的实际依赖调整）
window.getCurrentUserId = () => '123';

// 注入 team.js 到页面
const script = document.createElement('script');
script.textContent = teamJsCode;
document.body.appendChild(script);

// 等待脚本执行（同步注入，可立即使用）
console.log('✅ 已加载 team.js');

// ========================
// 开始测试
// ========================

function assert(condition, message) {
  if (!condition) {
    console.error('❌ 断言失败:', message);
    process.exit(1);
  } else {
    console.log('✅ 通过:', message);
  }
}

// 测试数据
const testMembers = [
  {
    id: 1,
    name: '张三',
    tech_stack: ['React', 'Node.js'],
    quality_score: 90,
    workload_score: 70,
    collaboration_score: 85,
    completion_score: 95
  },
  {
    id: 2,
    name: '李四',
    tech_stack: ['Vue'],
    quality_score: 80,
    workload_score: 60,
    collaboration_score: 70,
    completion_score: 88
  }
];

// === 测试 1：渲染功能 ===
console.log('\n🧪 测试 renderMembers 渲染...');
window.renderMembers(testMembers);

const cards = document.querySelectorAll('.member-card');
assert(cards.length === 2, '应渲染 2 个成员卡片');

const firstCard = cards[0];
assert(firstCard.getAttribute('data-id') === '1', '第一个卡片 data-id 应为 1');
assert(firstCard.querySelector('.member-name').textContent.includes('张三'), '应显示姓名 张三');
assert(firstCard.querySelector('.member-tech').textContent === 'React, Node.js', '技术栈应正确');

// === 测试 2：空状态 ===
console.log('\n🧪 测试空成员列表...');
window.renderMembers([]);
const emptyEl = document.querySelector('.member-empty');
assert(emptyEl !== null, '空状态应显示提示元素');
assert(emptyEl.textContent.includes('暂无团队成员'), '空状态文本应正确');

// === 测试 3：性能测试 ===
console.log('\n⏱️ 测试渲染性能（100 成员）...');
const largeMembers = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `成员${i + 1}`,
  tech_stack: ['JS'],
  quality_score: 80,
  workload_score: 50,
  collaboration_score: 70,
  completion_score: 0
}));

const start = Date.now();
window.renderMembers(largeMembers);
const duration = Date.now() - start;

console.log(`  渲染 100 个成员耗时: ${duration} ms`);
if (duration > 200) {
  console.warn('⚠️ 性能警告：渲染超过 200ms，但未中断测试');
} else {
  console.log('✅ 性能达标（< 200ms）');
}


// === 全部通过 ===
console.log('\n🎉 所有测试通过！');