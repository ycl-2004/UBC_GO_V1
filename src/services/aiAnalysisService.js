import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * AI Analysis Service for Admission Scenario Comparison
 * Uses Google Gemini API to provide intelligent analysis of scenario differences
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY

/**
 * Format scenario data for AI analysis
 */
function formatScenarioForAI(scenario, label) {
  const inputs = scenario.inputs_json || scenario.inputs || {}
  const results = scenario.results_json || scenario.results || {}
  
  return {
    label,
    program: scenario.program_id,
    inputs: {
      gpa: inputs.gpa || 'N/A',
      courseDifficulty: inputs.courseDifficulty || 'regular',
      applicantType: inputs.applicantType || 'domestic',
      gradeTrend: inputs.gradeTrend || 'stable',
      activityRelevance: inputs.activityRelevance || 'medium',
      roleDepth: inputs.roleDepth || 'member',
      extracurriculars: inputs.extracurriculars || 3,
      leadership: inputs.leadership || 3,
      volunteering: inputs.volunteering || 3,
      supplementScore: inputs.supplementScore || 50,
      coreSubjectScores: inputs.coreSubjectScores || {},
      courseStatus: inputs.courseStatus || {}
    },
    results: {
      admissionProbability: results.percentage || 0,
      finalScore: results.finalScore || 0,
      academicScore: results.academicScore || 0,
      profileScore: results.profileScore || 0,
      category: results.category || 'Reach',
      chance: results.chance || 'Low'
    }
  }
}

/**
 * Get AI-powered comparison analysis
 * @param {Object} scenarioA - First scenario
 * @param {Object} scenarioB - Second scenario
 * @returns {Object|null} AI analysis result or null if failed
 */
export async function getAIComparison(scenarioA, scenarioB) {
  // Check if API key is available
  if (!API_KEY) {
    console.warn('Gemini API key not found, falling back to estimated analysis')
    return null
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

    // Format scenarios for AI
    const scenarioAFormatted = formatScenarioForAI(scenarioA, 'Scenario A')
    const scenarioBFormatted = formatScenarioForAI(scenarioB, 'Scenario B')

    // Calculate input differences
    const inputDiffs = {}
    const inputsA = scenarioAFormatted.inputs
    const inputsB = scenarioBFormatted.inputs

    // Compare all input fields
    Object.keys(inputsA).forEach(key => {
      if (key === 'coreSubjectScores' || key === 'courseStatus') {
        // Handle nested objects
        const diff = {}
        const allKeys = new Set([
          ...Object.keys(inputsA[key] || {}),
          ...Object.keys(inputsB[key] || {})
        ])
        allKeys.forEach(subKey => {
          if (inputsA[key]?.[subKey] !== inputsB[key]?.[subKey]) {
            diff[subKey] = {
              from: inputsA[key]?.[subKey] || 'N/A',
              to: inputsB[key]?.[subKey] || 'N/A'
            }
          }
        })
        if (Object.keys(diff).length > 0) {
          inputDiffs[key] = diff
        }
      } else if (inputsA[key] !== inputsB[key]) {
        inputDiffs[key] = {
          from: inputsA[key],
          to: inputsB[key]
        }
      }
    })

    // Calculate result differences
    const resultDiffs = {
      admissionProbability: {
        from: scenarioAFormatted.results.admissionProbability,
        to: scenarioBFormatted.results.admissionProbability,
        delta: scenarioBFormatted.results.admissionProbability - scenarioAFormatted.results.admissionProbability
      },
      finalScore: {
        from: scenarioAFormatted.results.finalScore,
        to: scenarioBFormatted.results.finalScore,
        delta: scenarioBFormatted.results.finalScore - scenarioAFormatted.results.finalScore
      },
      academicScore: {
        from: scenarioAFormatted.results.academicScore,
        to: scenarioBFormatted.results.academicScore,
        delta: scenarioBFormatted.results.academicScore - scenarioAFormatted.results.academicScore
      },
      profileScore: {
        from: scenarioAFormatted.results.profileScore,
        to: scenarioBFormatted.results.profileScore,
        delta: scenarioBFormatted.results.profileScore - scenarioAFormatted.results.profileScore
      }
    }

    // Construct detailed prompt
    const prompt = `你是一名专业的 UBC (University of British Columbia) 招生顾问，拥有丰富的录取评估经验。

请分析以下两个申请情境的差异，并找出导致录取概率变化的最主要驱动因素。

## 申请项目
${scenarioAFormatted.program}

## 情境对比

### 情境 A (基准)
**输入数据：**
- GPA/平均分: ${inputsA.gpa}%
- 课程难度: ${inputsA.courseDifficulty}
- 申请人类型: ${inputsA.applicantType === 'domestic' ? '国内学生' : '国际学生'}
- 成绩趋势: ${inputsA.gradeTrend === 'rising' ? '上升' : inputsA.gradeTrend === 'declining' ? '下降' : '稳定'}
- 课外活动评分: ${inputsA.extracurriculars}/5
- 领导力评分: ${inputsA.leadership}/5
- 志愿服务评分: ${inputsA.volunteering}/5
- 活动相关性: ${inputsA.activityRelevance}
- 角色深度: ${inputsA.roleDepth}
${Object.keys(inputsA.coreSubjectScores || {}).length > 0 ? `- 核心科目分数: ${JSON.stringify(inputsA.coreSubjectScores)}` : ''}

**结果：**
- 录取概率: ${scenarioAFormatted.results.admissionProbability.toFixed(1)}%
- 最终分数: ${scenarioAFormatted.results.finalScore.toFixed(2)}/100
- 学术分数: ${scenarioAFormatted.results.academicScore.toFixed(2)}/100
- 个人档案分数: ${scenarioAFormatted.results.profileScore.toFixed(2)}/100
- 分类: ${scenarioAFormatted.results.category}

### 情境 B (对比)
**输入数据：**
- GPA/平均分: ${inputsB.gpa}%
- 课程难度: ${inputsB.courseDifficulty}
- 申请人类型: ${inputsB.applicantType === 'domestic' ? '国内学生' : '国际学生'}
- 成绩趋势: ${inputsB.gradeTrend === 'rising' ? '上升' : inputsB.gradeTrend === 'declining' ? '下降' : '稳定'}
- 课外活动评分: ${inputsB.extracurriculars}/5
- 领导力评分: ${inputsB.leadership}/5
- 志愿服务评分: ${inputsB.volunteering}/5
- 活动相关性: ${inputsB.activityRelevance}
- 角色深度: ${inputsB.roleDepth}
${Object.keys(inputsB.coreSubjectScores || {}).length > 0 ? `- 核心科目分数: ${JSON.stringify(inputsB.coreSubjectScores)}` : ''}

**结果：**
- 录取概率: ${scenarioBFormatted.results.admissionProbability.toFixed(1)}%
- 最终分数: ${scenarioBFormatted.results.finalScore.toFixed(2)}/100
- 学术分数: ${scenarioBFormatted.results.academicScore.toFixed(2)}/100
- 个人档案分数: ${scenarioBFormatted.results.profileScore.toFixed(2)}/100
- 分类: ${scenarioBFormatted.results.category}

## 关键差异
${JSON.stringify(inputDiffs, null, 2)}

## 结果差异
- 录取概率变化: ${resultDiffs.admissionProbability.delta > 0 ? '+' : ''}${resultDiffs.admissionProbability.delta.toFixed(1)}%
- 最终分数变化: ${resultDiffs.finalScore.delta > 0 ? '+' : ''}${resultDiffs.finalScore.delta.toFixed(2)}
- 学术分数变化: ${resultDiffs.academicScore.delta > 0 ? '+' : ''}${resultDiffs.academicScore.delta.toFixed(2)}
- 个人档案分数变化: ${resultDiffs.profileScore.delta > 0 ? '+' : ''}${resultDiffs.profileScore.delta.toFixed(2)}

## 你的任务

请作为专业的 UBC 招生顾问，分析以上数据并回答：

1. **主要驱动因素 (Primary Driver)**: 哪个输入因素的变化对录取概率的影响最大？为什么？
   - 考虑 UBC 的录取权重（通常学术成绩占 70%，个人档案占 30%）
   - 考虑该专业的具体要求（如核心科目分数的重要性）
   - 考虑因素之间的相互作用

2. **关键洞察 (Key Insights)**: 提供 2-3 条具体的、可执行的建议，说明如何进一步提升录取概率。

## 输出格式要求

请以 JSON 格式返回，格式如下：
{
  "primaryDriver": {
    "field": "字段名称（如 'gpa', 'English12', 'extracurriculars'）",
    "label": "用户友好的标签（如 'GPA / 平均分', 'English 12 分数', '课外活动'）",
    "inputDelta": 数值变化（如 5.0 表示增加 5%），
    "impact": "影响描述（如 '高影响 - 学术成绩是录取的核心因素'）",
    "percentage": 贡献百分比（0-100，表示这个因素占总变化的百分比）
  },
  "insights": [
    "第一条洞察（具体、可执行）",
    "第二条洞察（具体、可执行）",
    "第三条洞察（具体、可执行）"
  ],
  "reasoning": "简要说明为什么这个因素是主要驱动因素（1-2句话）"
}

**重要：只返回 JSON，不要包含任何其他文字或 markdown 格式。**`

    // Call Gemini API
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Parse JSON response
    // Remove markdown code blocks if present
    let jsonText = text.trim()
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '')
    }

    const aiResult = JSON.parse(jsonText)

    // Validate and format the response
    if (aiResult.primaryDriver && aiResult.insights) {
      return {
        primaryDriver: {
          field: aiResult.primaryDriver.field || 'unknown',
          label: aiResult.primaryDriver.label || 'Unknown',
          inputDelta: aiResult.primaryDriver.inputDelta || 0,
          impact: aiResult.primaryDriver.impact || '',
          percentage: Math.abs(parseFloat(aiResult.primaryDriver.percentage) || 0),
          reasoning: aiResult.reasoning || ''
        },
        insights: Array.isArray(aiResult.insights) ? aiResult.insights : [],
        method: 'ai'
      }
    }

    return null
  } catch (error) {
    console.error('AI Analysis failed:', error)
    // Return null to trigger fallback to estimated analysis
    return null
  }
}

/**
 * Check if AI service is available
 */
export function isAIAvailable() {
  return !!API_KEY
}

