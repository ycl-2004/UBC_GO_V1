/**
 * AI Analysis Service for Admission Scenario Comparison
 * Uses ChatAnywhere API (OpenAI Standard Protocol) to provide intelligent analysis of scenario differences
 * 
 * Features:
 * - Automatic fallback to estimated analysis if AI fails
 * - Rate limit handling (200 requests/day for free tier)
 * - Direct connection optimized for China/overseas without VPN
 */

const API_KEY = import.meta.env.VITE_CHATANYWHERE_API_KEY
const MODEL = 'gpt-4o-mini' // 200 requests/day limit, use deepseek-v3 as fallback if needed

// Determine API URL based on environment
// In development, use Vite proxy to avoid CORS issues
// In production, use direct URL (backend proxy recommended for security)
const getApiUrl = () => {
  // In development, ALWAYS use proxy (ignore BASE_URL env var to prevent CORS)
  if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
    const proxyUrl = '/api-proxy/v1/chat/completions'
    console.log('🔧 Development mode: Using Vite proxy:', proxyUrl)
    return proxyUrl
  }
  
  // In production, use BASE_URL if provided, otherwise default
  const baseUrl = import.meta.env.VITE_CHATANYWHERE_BASE_URL || 'https://api.chatanywhere.org'
  
  // Ensure full path is included
  let finalUrl = baseUrl
  if (!finalUrl.includes('/v1/chat/completions')) {
    // Remove trailing slash if present
    finalUrl = finalUrl.replace(/\/$/, '')
    // Append path if missing
    finalUrl = finalUrl + '/v1/chat/completions'
  }
  
  console.log('🔧 Production mode: Using URL:', finalUrl)
  return finalUrl
}

const BASE_URL = getApiUrl()

/**
 * Validate URL before making API request
 * @param {string} url - URL to validate
 * @returns {boolean} - True if URL is valid
 */
const isValidUrl = (url) => {
  try {
    // For relative URLs (proxy), check if it starts with /api-proxy
    if (url.startsWith('/')) {
      return url.startsWith('/api-proxy') || url.startsWith('/v1/chat/completions')
    }
    // For absolute URLs, validate the URL structure
    const urlObj = new URL(url)
    return urlObj.protocol === 'https:' && urlObj.hostname.includes('chatanywhere.org')
  } catch {
    return false
  }
}

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
    console.warn('ChatAnywhere API key not found, falling back to estimated analysis')
    return null
  }

  try {
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

    // Validate URL before making request
    if (!isValidUrl(BASE_URL)) {
      console.error('❌ Invalid API URL:', BASE_URL)
      throw new Error('Invalid API URL. Please check your configuration.')
    }
    
    // Call ChatAnywhere API
    console.log(`🤖 Calling ChatAnywhere API with model: ${MODEL}`)
    console.log(`   URL: ${BASE_URL}`)
    console.log(`   Environment: ${import.meta.env.MODE}`)
    console.log(`   Using proxy: ${BASE_URL.startsWith('/api-proxy')}`)
    
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: '你是一名专业的 UBC (University of British Columbia) 招生顾问，拥有丰富的录取评估经验。请以 JSON 格式返回分析结果，只返回 JSON，不要包含任何其他文字或 markdown 格式。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      
      if (response.status === 404) {
        console.error('❌ Endpoint not found (404)')
        console.error(`   URL called: ${BASE_URL}`)
        console.error('   Check that the URL includes /v1/chat/completions')
        if (import.meta.env.DEV) {
          console.error('   Development: Should use /api-proxy/v1/chat/completions')
          console.error('   Make sure Vite dev server is running and proxy is configured')
        }
      } else if (response.status === 429) {
        console.error('❌ Rate limit exceeded (429)')
        console.error('   ChatAnywhere free tier has a 200 requests/day limit.')
        console.error('   Please wait before making another request or check status at status.chatanywhere.org')
      } else if (response.status === 401 || response.status === 403) {
        console.error(`❌ API key authentication failed (${response.status})`)
        console.error('   Please check your ChatAnywhere API key.')
      } else {
        console.error(`❌ API request failed (${response.status}):`, errorText)
      }
      
      return null
    }

    const data = await response.json()
    
    // Parse response from OpenAI-compatible format
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.warn('⚠️ Invalid API response format')
      return null
    }

    const content = data.choices[0].message.content
    
    // Parse JSON response
    // Remove markdown code blocks if present
    let jsonText = content.trim()
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '')
    }

    const aiResult = JSON.parse(jsonText)

    // Validate and format the response
    if (aiResult.primaryDriver && aiResult.insights) {
      console.log('✅ AI analysis completed successfully')
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
        method: 'ai',
        model: MODEL
      }
    }

    console.warn('⚠️ AI returned invalid response format')
    return null
  } catch (error) {
    // Provide detailed error information
    if (error instanceof SyntaxError) {
      console.error('❌ Failed to parse JSON response:', error.message)
    } else if (error.message?.includes('fetch')) {
      console.error('❌ Network error:', error.message)
      if (import.meta.env.DEV) {
        console.error('   Development: Using Vite proxy. Check that dev server is running.')
      } else {
        console.error('   Production: Check your internet connection or API endpoint availability.')
      }
      console.error('   Status: status.chatanywhere.org')
    } else {
      console.error('❌ AI Analysis failed:', error.message || error)
    }
    
    // Return null to trigger fallback to estimated analysis
    return null
  }
}

/**
 * Check if AI service is available
 * Note: This only checks for API key presence, not actual API availability
 */
export function isAIAvailable() {
  return !!API_KEY
}
