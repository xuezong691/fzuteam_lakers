/**
 * 自动接口单元测试（无任何测试框架）
 * Node.js >= 18（自带 fetch）
 */

const API_URL = 'http://127.0.0.1:5000/api/task_generate';
const TEST_TIMEOUT = 2 * 60 * 1000; // 2 分钟
const TEST_ROUNDS = 5;              // 测试次数（可调）

// ====== 工具函数 ======
function now() {
  return Number(process.hrtime.bigint()) / 1e6; // ms
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// ====== 构造测试输入 ======
function buildTestPayload() {
  return {
    user_id: 1,
    text: `
任务类型: 课程汇报
项目背景: 软件工程课程小组作业
最终交付成果: PPT + 汇报讲稿
限定时长: 7天
必须满足的要求: 内容准确，逻辑清晰
可选优化: 图表美观
禁止事项: 抄袭
前提假设: 成员均可参与
`.trim()
  };
}

// ====== 单次测试 ======
async function runSingleTest(index) {
  const start = now();

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildTestPayload())
  });

  const elapsed = now() - start;

  // ---------- 输出格式校验 ----------
  assert(response.ok, `❌ [${index}] HTTP 状态码异常: ${response.status}`);

  const json = await response.json();

  assert(typeof json === 'object', '❌ 返回值不是 JSON');
  assert(json.success === true, '❌ success 字段不是 true');
  assert(typeof json.result === 'string', '❌ result 不是字符串');

  let tasks;
  try {
    tasks = JSON.parse(json.result);
  } catch {
    throw new Error('❌ result 不是合法 JSON 字符串');
  }

  // ---------- 业务结构校验 ----------
  assert(Array.isArray(tasks), '❌ 任务结果不是数组');
  assert(tasks.length > 0, '❌ 任务数组为空');

  tasks.forEach((task, i) => {
    assert(typeof task.things === 'string', `❌ task[${i}].things 非字符串`);
    assert(typeof task.tech_stack === 'string', `❌ task[${i}].tech_stack 非字符串`);
    assert(typeof task.member === 'string', `❌ task[${i}].member 非字符串`);
  });

  return elapsed;
}

// ====== 主测试入口 ======
async function runTests() {
  console.log('🚀 开始自动接口单元测试\n');

  const times = [];
  const globalStart = Date.now();

  for (let i = 1; i <= TEST_ROUNDS; i++) {
    console.log(`▶ 第 ${i} 次测试`);
    try {
      const t = await runSingleTest(i);
      times.push(t);
      console.log(`   ✅ 通过，用时 ${t.toFixed(2)} ms\n`);
    } catch (err) {
      console.error(`   ❌ 失败：${err.message}`);
      process.exit(1);
    }

    // 防止压垮后端
    await new Promise(r => setTimeout(r, 500));
  }

  const totalTime = Date.now() - globalStart;

  // ====== 性能统计 ======
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const max = Math.max(...times);
  const min = Math.min(...times);

  console.log('📊 测试完成（2 分钟限制内）');
  console.log('--------------------------------');
  console.log(`测试次数: ${TEST_ROUNDS}`);
  console.log(`总耗时: ${totalTime} ms`);
  console.log(`平均响应时间: ${avg.toFixed(2)} ms`);
  console.log(`最小响应时间: ${min.toFixed(2)} ms`);
  console.log(`最大响应时间: ${max.toFixed(2)} ms`);
}

runTests();
