import { AnalysisResult, CleanupItem, AIAnalysisResult, RiskLevel, SystemData } from '../types';

export class AIService {
  private apiKey: string = '';
  private baseUrl: string = 'https://api.deepseek.com/v1/chat/completions';

  constructor() {
    // API密钥需要通过setApiKey方法设置
    this.apiKey = '';
  }

  // 设置API密钥
  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  // 分析磁盘数据并生成清理方案（旧版本，保持兼容性）
  async analyzeStorage(storageData: string): Promise<AIAnalysisResult> {
    if (!this.apiKey) {
      throw new Error('请先设置DeepSeek API密钥');
    }

    const prompt = this.createAnalysisPrompt(storageData);

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的Mac系统清理专家，能够分析磁盘使用情况并提供安全的清理建议。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result || !result.choices || !result.choices[0] || !result.choices[0].message) {
        throw new Error('API响应格式错误');
      }
      
      const aiResponse = result.choices[0].message.content;
      
      if (!aiResponse) {
        throw new Error('AI响应内容为空');
      }

      return this.parseAIResponse(aiResponse);
    } catch (error) {
      console.error('AI分析失败:', error);
      throw new Error('AI分析服务暂时不可用');
    }
  }

  // 使用SystemData进行分析（新版本，支持风险等级和快照）
  async analyzeSystemData(systemData: SystemData): Promise<AIAnalysisResult> {
    console.log('🔍 [AI分析] 开始分析系统数据');
    console.log('📊 [AI分析] 输入数据:', JSON.stringify(systemData, null, 2));
    
    if (!this.apiKey) {
      console.error('❌ [AI分析] API密钥未设置');
      throw new Error('请先设置DeepSeek API密钥');
    }

    const prompt = this.createAnalysisPrompt(JSON.stringify(systemData, null, 2));
    console.log('📝 [AI分析] 生成的提示词长度:', prompt.length);

    const requestBody = {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: '你是一位顶级的macOS系统性能与维护专家，专门为非技术背景的用户提供安全、易懂的磁盘清理方案。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 3000
    };
    
    console.log('🚀 [AI分析] 发送API请求:', JSON.stringify(requestBody, null, 2));

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 [AI分析] API响应状态:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [AI分析] API请求失败，响应内容:', errorText);
        throw new Error(`API请求失败: ${response.status}`);
      }

      const result = await response.json();
      console.log('📥 [AI分析] API响应数据:', JSON.stringify(result, null, 2));
      
      if (!result || !result.choices || !result.choices[0] || !result.choices[0].message) {
        console.error('❌ [AI分析] API响应格式错误:', result);
        throw new Error('API响应格式错误');
      }
      
      const aiResponse = result.choices[0].message.content;
      console.log('🤖 [AI分析] AI原始响应内容:', aiResponse);
      
      if (!aiResponse) {
        console.error('❌ [AI分析] AI响应内容为空');
        throw new Error('AI响应内容为空');
      }

      const parsedResult = this.parseAIResponse(aiResponse);
      console.log('✅ [AI分析] 解析后的结果:', JSON.stringify(parsedResult, null, 2));
      
      return parsedResult;
    } catch (error) {
      console.error('❌ [AI分析] 分析失败:', error);
      throw new Error('AI分析服务暂时不可用');
    }
  }

  // 创建分析提示词
  private createAnalysisPrompt(storageData: string): string {
    return `
**角色:** 你是一位顶级的macOS系统性能与维护专家。你的核心任务是分析用户提供的磁盘使用数据，并为**非技术背景的用户**生成一份极其**安全、易于理解、可操作**的分析报告与清理方案。你的所有建议都必须将用户数据安全置于首位。

**输入数据格式:**
我将为你提供一个JSON对象，包含以下字段。如果某个字段的数据为空数组 \`[]\`，则代表没有检测到相关项目。

*   \`disk_usage\`: \`{ total: string, used: string, available: string }\` (来自 \`df -H\` 的数据)
*   \`user_folders\`: \`[ { path: string, size: string }, ... ]\` (来自 \`du -sh ~/*\` 的数据)
*   \`user_caches\`: \`[ { path: string, size: string }, ... ]\` (来自 \`du -sh ~/Library/Caches/*\` 的数据)
*   \`system_caches\`: \`[ { path: string, size: string }, ... ]\` (来自 \`du -sh /Library/Caches/*\` 的数据)
*   \`large_files\`: \`[ { path: string, size: string }, ... ]\` (来自 \`mdfind\` 的数据)
*   \`local_snapshots\`: \`string[]\` (来自 \`tmutil listlocalsnapshots /\` 的数据，这是一个快照名称的列表)

**输入数据:**
${storageData}

**输出要求:**
请**严格**按照以下JSON格式返回你的分析结果，**不要在JSON代码块之外添加任何额外的解释性文字**。

\`\`\`json
{
  "root_cause_analysis": "一段通俗易懂、语气温和的文字，解释磁盘空间被占用的主要原因。首先总结最核心的问题，然后可以分点说明。例如：'您的Mac空间有些紧张，主要有两大原因：一是系统为您自动创建的备份快照占用了不少"可清除"空间；二是一些常用软件的缓存文件也积累得比较多。'",
  "cleaning_plan": [
    {
      "id": "clear_user_caches",
      "checked": true,
      "title": "清理用户应用缓存",
      "description": "安全清除各应用产生的临时文件。这不会影响您的个人数据和设置，是释放空间最常规、最安全的操作。",
      "risk_level": "low",
      "estimated_size_gb": 5.4,
      "command": "rm -rf ~/Library/Caches/*"
    },
    {
      "id": "empty_trash",
      "checked": true,
      "title": "清空废纸篓",
      "description": "永久删除您已移入废纸篓的文件。请确认废纸篓中没有您还需要的文件。",
      "risk_level": "low",
      "estimated_size_gb": 2.1,
      "command": "rm -rf ~/.Trash/*"
    },
    {
      "id": "thin_local_snapshots",
      "checked": true,
      "title": "清理本地时间机器快照",
      "description": "macOS会自动创建本地快照用于文件恢复。清理它们可以立即释放大量空间，是解决"可清除空间"过多的主要方法。此操作是安全的，但会移除近期的部分文件恢复点。",
      "risk_level": "medium",
      "estimated_size_gb": 25.0,
      "command": "tmutil thinlocalsnapshots / 10000000000 4"
    },
    {
      "id": "clean_large_downloads",
      "checked": true,
      "title": "管理"下载"文件夹中的大文件",
      "description": "您的"下载"文件夹中存在较大的文件。此操作将为您打开该文件夹，请您手动检查并删除不再需要的文件（如已看过的电影或旧的安装包）。",
      "risk_level": "high",
      "estimated_size_gb": 10.2,
      "command": "open ~/Downloads"
    }
  ]
}
\`\`\`

**规则与约束 (极其重要):**

1.  **风险等级定义 (\`risk_level\`):** 你必须为每个清理项分配一个风险等级。
    *   **\`low\` (低风险):** 用于绝对安全、不会导致任何数据丢失的操作。例如：清理缓存、日志、清空废纸篓。这是最推荐用户执行的。
    *   **\`medium\` (中等风险):** 用于会移除系统某些恢复功能或非关键性系统组件的操作。例如：清理本地快照、移除多余的语言文件等。操作本身安全，但用户应被告知其后果。
    *   **\`high\` (高风险):** 用于任何可能涉及用户个人创建文件（文档、照片、下载内容等）的操作。对于这类操作，你的\`command\`**永远不应该是删除命令 (\`rm\`)**，而应该是**打开目录的命令 (\`open\`)**，引导用户自行判断和管理。

2.  **快照处理:** 如果输入的 \`local_snapshots\` 数组**不为空**，你需要根据快照类型生成相应的清理策略：
    
    **系统更新快照 (com.apple.os.update-*):** 这些是macOS系统更新过程中创建的快照，**不能通过常规方法删除**。对于这类快照，你应该：
    - 在 \`description\` 中说明这些是系统保护的更新快照，无法手动删除
    - 建议用户等待系统自动清理或重启后再次检查
    - **不要**生成删除命令，而是生成信息提示命令如 \`echo "系统更新快照将由macOS自动管理"\
    
    **普通时间机器快照:** 对于非系统更新的快照，可以生成清理命令：
    - 使用 \`tmutil thinlocalsnapshots / [字节数] [紧急程度]\` 命令
    - 在 \`description\` 中解释什么是快照和"可清除空间"
    - 设置风险等级为 \`medium\`
    
    **快照优化提示:** 如果快照数量超过10个或预估大小超过20GB，你应该在 \`description\` 中额外提醒用户："由于快照文件较大，建议您考虑在系统偏好设置中关闭时间机器的本地快照功能，以避免未来占用过多空间。"

3.  **安全第一:** 绝对禁止生成任何会删除系统关键目录（如 \`/System\`, \`/Library\`, \`/private\`, \`~/Library/Application Support\`）或用户核心个人目录（如 \`~/Documents\`, \`~/Pictures\`）的 \`rm\` 命令。

4.  **数据驱动:** 你的所有分析和方案都必须严格基于我提供的输入数据。如果 \`large_files\` 列表中有大量文件位于 \`~/Downloads\`，就生成 \`clean_large_downloads\` 方案；如果没有，就不生成。

5.  **解释清晰:** \`description\` 字段的文字必须让一个完全不懂电脑的人也能明白这个操作是做什么的、是否安全、有什么影响。

6.  **默认全选:** \`checked\` 字段的值必须始终为 \`true\`，将选择权交给用户。
`;
  }

  // 解析AI响应
  private parseAIResponse(response: string): AIAnalysisResult {
    console.log('🔧 [AI解析] 开始解析AI响应');
    console.log('📄 [AI解析] 原始响应长度:', response.length);
    
    try {
      // 尝试从响应中提取JSON
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      let jsonStr = jsonMatch ? jsonMatch[1] : response;
      
      console.log('🔍 [AI解析] JSON代码块匹配结果:', jsonMatch ? '找到' : '未找到');
      
      // 如果没有找到JSON代码块，尝试直接解析整个响应
      if (!jsonMatch) {
        console.log('🔍 [AI解析] 尝试从整个响应中提取JSON对象');
        // 查找可能的JSON对象
        const startIndex = response.indexOf('{');
        const lastIndex = response.lastIndexOf('}');
        if (startIndex !== -1 && lastIndex !== -1 && lastIndex > startIndex) {
          jsonStr = response.substring(startIndex, lastIndex + 1);
          console.log('🔍 [AI解析] 提取的JSON字符串位置:', startIndex, '到', lastIndex);
        }
      }
      
      console.log('📝 [AI解析] 待解析的JSON字符串:', jsonStr);
      
      const parsed = JSON.parse(jsonStr);
      console.log('✅ [AI解析] JSON解析成功:', JSON.stringify(parsed, null, 2));
      
      // 检查解析结果的有效性
      if (!parsed || typeof parsed !== 'object') {
        console.error('❌ [AI解析] 解析结果不是有效对象:', parsed);
        throw new Error('解析结果不是有效对象');
      }
      
      if (!parsed.cleaning_plan || !Array.isArray(parsed.cleaning_plan)) {
        console.error('❌ [AI解析] cleaning_plan字段缺失或格式错误:', parsed.cleaning_plan);
        throw new Error('cleaning_plan字段缺失或格式错误');
      }
      
      console.log('📋 [AI解析] 清理计划项目数量:', parsed.cleaning_plan.length);
      
      // 转换为内部格式
      const cleanupItems: CleanupItem[] = parsed.cleaning_plan.map((item: any, index: number) => {
        const cleanupItem = {
          id: item.id || `cleanup_${index + 1}`,
          checked: item.checked !== false, // 默认选中
          title: item.title || '清理项目',
          description: item.description || '',
          estimated_size_gb: item.estimated_size_gb || 0,
          command: item.command || '',
          risk_level: (item.risk_level as RiskLevel) || 'low'
        };
        console.log(`🔧 [AI解析] 转换清理项目 ${index + 1}:`, JSON.stringify(cleanupItem, null, 2));
        return cleanupItem;
      });
      
      const result = {
         root_cause_analysis: parsed.root_cause_analysis,
         cleaning_plan: cleanupItems
       };
       
      console.log('✅ [AI解析] 最终解析结果:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('❌ [AI解析] 解析AI响应失败:', error);
      console.error('❌ [AI解析] 错误详情:', error instanceof Error ? error.message : String(error));
      
      // 返回默认结果
      const defaultResult = {
         root_cause_analysis: '抱歉，AI分析结果解析失败。建议您手动检查磁盘使用情况。',
         cleaning_plan: []
       };
       
      console.log('🔄 [AI解析] 返回默认结果:', JSON.stringify(defaultResult, null, 2));
      return defaultResult;
    }
  }


}

export const aiService = new AIService();