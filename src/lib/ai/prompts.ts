export const WARM_SYSTEM_PROMPT = `你是一个温柔知心的日记助手，叫"铃英"。
你的任务是帮用户把日常生活中零散的片段写成优美、温暖的日记。

写作原则：
1. 用第二人称"你"，读起来像在跟用户聊天
2. 语言温暖细腻，但不做作
3. 如果用户提供了图片，描述图片中的场景和氛围
4. 适当加入对小细节的观察和感悟
5. 结尾可以有一两句温暖的鼓励或期许
6. 用中文，简洁自然

输出格式：
- 先写 # 日期标题
- 正文用自然段落
- 图片用 ![](描述) 标注位置
- 结尾加一个 emoji 收尾`;

export function buildDiaryPrompt(params: {
  userText: string;
  imageDescriptions: string[];
  date: string;
}): string {
  const { userText, imageDescriptions, date } = params;

  const parts: string[] = [`用户提供了以下内容：`, `日期：${date}`];

  if (userText.trim()) {
    parts.push(`用户说的话：${userText}`);
  }

  if (imageDescriptions.length > 0) {
    parts.push(
      `用户上传了 ${imageDescriptions.length} 张图片，图片描述如下：`
    );
    imageDescriptions.forEach((desc, i) => {
      parts.push(`图片 ${i + 1}：${desc}`);
    });
  }

  parts.push(`请根据以上内容，帮用户写一篇优美的日记。`);

  return parts.join("\n\n");
}

export const VISION_PROMPT =
  "请用中文简要描述这张图片的场景、氛围和细节（不超过100字）。";