export const texts: string[] = [
  // 全英文示例 - 短句
  'The quick brown fox jumps over the lazy dog.',
  'Programming is the process of creating a set of instructions that tell a computer how to perform a task.',
  'Technology continues to evolve at a rapid pace, changing how we live our lives.',

  // 全英文示例 - 长段落
  "The quick brown fox jumps over the lazy dog. This sentence contains all the letters in the English alphabet. The quick brown fox jumps over the lazy dog. This sentence contains all the letters in the English alphabet. The quick brown fox jumps over the lazy dog. This sentence contains all the letters in the English alphabet. The quick brown fox jumps over the lazy dog. This sentence contains all the letters in the English alphabet. The quick brown fox jumps over the lazy dog. This sentence contains all the letters in the English alphabet. The quick brown fox jumps over the lazy dog. This sentence contains all the letters in the English alphabet.",

  // 英文段落带数字和特殊符号
  "In 2023, over 85% of global businesses invested in digital transformation. The average ROI was approximately $2.5 million per company! However, statistics show that only 30-40% of initiatives fully achieved their objectives. 'Success requires cultural change, not just technology,' said Dr. Smith (CEO of TechCorp).",

  // 英文长单词测试
  "Pneumonoultramicroscopicsilicovolcanoconiosis is one of the longest words in English dictionaries. Antidisestablishmentarianism and supercalifragilisticexpialidocious are also exceptionally long words that challenge typists.",

  // 全中文示例 - 短句
  "学而时习之，不亦说乎？有朋自远方来，不亦乐乎？人不知而不愠，不亦君子乎？",
  "千里之行，始于足下。不积跬步，无以至千里；不积小流，无以成江海。",
  "生活不止眼前的苟且，还有诗和远方。",

  // 全中文示例 - 长段落
  "春风送暖入屠苏，草长莺飞二月天。拂堤杨柳醉春烟，残雪压枝犹有丰姿。海棠未雨，梨花先雪，一半春休。疏影横斜水清浅，暗香浮动月黄昏。乱花渐欲迷人眼，浅草才能没马蹄。接天莲叶无穷碧，映日荷花别样红。小荷才露尖尖角，早有蜻蜓立上头。黑云翻墨未遮山，白雨跳珠乱入船。卷地风来忽吹散，望湖楼下水如天。山重水复疑无路，柳暗花明又一村。竹外桃花三两枝，春江水暖鸭先知。好雨知时节，当春乃发生。随风潜入夜，润物细无声。",

  // 中文带标点和特殊格式
  "《论语》中说：\"工欲善其事，必先利其器。\"这句话强调了工具的重要性。电脑键盘是现代人的\"利器\"之一，熟练地使用它可以大大提高工作效率！2023年的数据显示，平均打字速度超过60WPM（每分钟词数）的人，工作效率可提升25%。",

  // 中英文混合 - 短句
  "打字练习是提高键盘输入速度的好方法。Typing practice is a great way to improve your keyboard input speed.",
  "互联网（Internet）已经成为现代生活的必需品，它连接了全球各地的人们并提供了丰富的信息资源。",

  // 中英文混合 - 技术内容
  "编程（Programming）是创建计算机软件的过程，需要掌握算法（Algorithm）和数据结构（Data Structure）等基础知识。在Python中，我们可以使用`for i in range(10):`来创建一个循环。而在JavaScript中，相应的语法是`for(let i=0; i<10; i++)`。不同编程语言有不同的语法规则，但核心概念往往是相通的。",

  // 中英文混合 - 长段落
  "AI人工智能技术正在改变我们的生活方式。Machine Learning 机器学习使计算机能够从数据中学习并做出决策。深度学习（Deep Learning）是机器学习的一个子集，它使用神经网络（Neural Networks）来模拟人脑的学习过程。自然语言处理（Natural Language Processing, NLP）让计算机能够理解和生成人类语言，这项技术已经应用于智能助手（Smart Assistants）如Siri、Alexa和Google Assistant中。计算机视觉（Computer Vision）则让机器能够\"看见\"并理解图像和视频内容。这些技术共同推动了自动驾驶汽车（Self-driving Cars）、智能医疗诊断（Intelligent Medical Diagnosis）和个性化推荐系统（Personalized Recommendation Systems）等应用的发展。",

  // 复杂格式测试 - 引号、括号和数字混合
  "在\"十四五\"规划中，中国提出了\"碳达峰、碳中和\"的目标。到2030年，单位GDP二氧化碳排放将比2005年下降65%以上，非化石能源占一次能源消费比重将达到25%左右，森林蓄积量将比2005年增加60亿立方米，风电、太阳能发电总装机容量将达到12亿千瓦以上。这被专家称为\"史上最强的气候政策承诺\"。",

  // 复杂格式测试 - 大量数字
  "以下是一些重要的数学常数：π (Pi) 约等于 3.14159265359，自然对数的底 e 约等于 2.71828182846，黄金比例 φ 约等于 1.61803398875。在物理学中，光速约为299,792,458米/秒，重力加速度约为9.80665米/秒²，阿伏伽德罗常数约为6.02214076×10²³ /摩尔。",

  // 复杂格式测试 - 多种符号
  "常见的编程符号包括：算术运算符 (+, -, *, /, %, **), 比较运算符 (==, !=, >, <, >=, <=), 逻辑运算符 (&&, ||, !), 位运算符 (&, |, ^, ~, <<, >>), 赋值运算符 (=, +=, -=, *=, /=, %=), 以及其他特殊符号如 # $ @ ! ? : ; { } [ ] ( ) / \\ _ \" ' ` ~ , . < >等。",

  // 网页内容测试
  "HTML文档的基本结构：<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\"><title>页面标题</title></head><body><h1>这是标题</h1><p>这是段落。</p></body></html>",

  // 代码混合测试
  "在学习JavaScript时，你会经常看到这样的代码：function calculateSum(a, b) { return a + b; } 这个函数用于计算两个数的和。如果要在网页上显示结果，可以使用 document.getElementById('result').textContent = calculateSum(5, 3); 这行代码会在ID为'result'的元素中显示8。",

  // 多语言混合测试
  "你好(中文)，Hello(英文)，Bonjour(法语)，Hola(西班牙语)，Ciao(意大利语)，こんにちは(日语)，안녕하세요(韩语)，Привет(俄语)，مرحبا(阿拉伯语)，שלום(希伯来语)，नमस्ते(印地语)，Γειά σου(希腊语)。",

  // 超长段落测试
  "随着信息技术的飞速发展，人类社会正经历着前所未有的数字化转型。云计算(Cloud Computing)、大数据(Big Data)、物联网(Internet of Things)、区块链(Blockchain)和人工智能(Artificial Intelligence)等技术正在重塑各行各业。在这个数字时代，打字技能变得尤为重要。无论是编写代码、撰写报告、发送电子邮件，还是在社交媒体上交流，良好的打字能力都能显著提高效率。根据研究，专业打字员的打字速度通常在60-80WPM(每分钟词数)之间，而世界纪录甚至超过了200WPM。通过定期练习，普通人的打字速度通常可以从初始的20WPM提高到40-60WPM。提高打字速度的关键包括：正确的手指位置(手指应放在键盘的\"家庭行\"上，即ASDF和JKL;)，不看键盘打字(培养肌肉记忆)，以及定期练习(特别是对常用单词和短语)。在数字化教育中，学生们越来越早地开始学习打字技能，为未来的学习和工作做准备。随着语音识别技术的进步，有人可能会质疑打字技能的未来价值，但专家们认为，在可预见的未来，键盘仍将是人机交互的主要工具之一，尤其是在需要精确输入和编辑的场景中。因此，投资时间提高打字技能，仍然是一项值得的长期投资。",

  // 添加带有换行符的中文示例文本
  `打字练习：
这是一个包含换行符的示例文本。
每一行结束后都会有一个换行符。
你可以通过按回车键来输入它们。
这样可以练习在实际使用中的换行操作。`,

  // 添加带有换行符的英文示例文本
  `Typing Practice:
This is a sample text with line breaks.
Each line ends with a line break.
You can press Enter key to input them.
This helps you practice line breaks in real-world use.`,

  `Module 1

Unit 1: I'm Sam.

Hi!
Aah... Hi!
Hello!
Ooh... Hello!
Hello, I'm Sam.
Hello, Sam.
Hello, I'm Amy.
Hello, Amy.
I'm Lingling.
Hi, Lingling.
I'm Daming.
Hi, Daming.
Goodbye, Lingling.
Goodbye, Daming.
Bye-bye, Amy.
Bye-bye, Sam.
Hello, I'm Sam!
Hello, I'm Daming!
Goodbye, Daming!
Goodbye, Sam!
Hello.
Hi.
Goodbye.
Bye-bye.`,

  // 补充内容 - 古诗词
  `静夜思
床前明月光，疑是地上霜。
举头望明月，低头思故乡。`,

  `登鹳雀楼
白日依山尽，黄河入海流。
欲穷千里目，更上一层楼。`,

  // 补充内容 - 现代短文
  "时间是世界上最宝贵的资源。我们无法购买它，无法储存它，只能选择如何使用它。每个人每天都有24小时，但有的人可以创造奇迹，有的人却在虚度光阴。关键在于我们如何规划和利用这些时间。",

  // 补充内容 - 英文名言
  "\"The only way to do great work is to love what you do.\" - Steve Jobs. This quote reminds us that passion is essential for success. When you truly enjoy your work, excellence becomes natural, and challenges become opportunities for growth.",

  // 补充内容 - 科技短文
  "量子计算（Quantum Computing）被认为是下一代计算技术的革命。与传统计算机使用0和1的二进制不同，量子计算机使用量子比特（Qubits），可以同时处于0和1的叠加态。这种特性使得量子计算机在某些特定问题上的计算能力远超传统计算机，特别是在密码学、药物研发和气候模拟等领域。",

  // 补充内容 - 日常对话
  `小明：今天天气真不错！
小红：是啊，我们去公园散步吧。
小明：好主意！顺便带上相机拍些照片。
小红：那我们下午两点在公园门口见面？
小明：没问题，一会儿见！`,

  // 补充内容 - 编程概念
  "面向对象编程（Object-Oriented Programming, OOP）的三大特性是封装（Encapsulation）、继承（Inheritance）和多态（Polymorphism）。封装隐藏了对象的内部实现细节，继承允许创建具有共同特征的类层次结构，多态使得同一个接口可以有不同的实现方式。这些特性使代码更加模块化、可重用和易于维护。",

  // 补充内容 - 数学题目
  "已知 f(x) = 2x + 3，求 f(5) 的值。解：将 x = 5 代入函数式，得 f(5) = 2 × 5 + 3 = 10 + 3 = 13。因此，f(5) 的值为 13。",

  // 补充内容 - 混合符号练习
  "Email: user@example.com | Phone: +86-138-0000-0000 | Website: https://www.example.com | Price: $99.99 | Discount: 20% OFF | Date: 2024/01/01 | Time: 14:30:00",

  // 补充内容 - 成语接龙
  "一马当先 → 先入为主 → 主次分明 → 明察秋毫 → 毫不犹豫 → 豫章故郡 → 郡县制度 → 度日如年 → 年富力强 → 强词夺理",

  // 补充内容 - JSON 格式
  `{
  "name": "张三",
  "age": 25,
  "skills": ["JavaScript", "Python", "React"],
  "contact": {
    "email": "zhangsan@example.com",
    "phone": "138-0000-0000"
  }
}`
];
