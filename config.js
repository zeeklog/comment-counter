exports.LANG = 'zh'
/**
 * @title 需要统计的文件类型
 * @title Input File type which need to count its comment.
 *
 * @description 默认统计前端常见的.js / .jsx / .ts / .tsx /.vue 5种文件类型
 * **/
exports.countType = [
    '.js',
    '.jsx',
    '.ts',
    '.tsx',
    '.vue'
]
/**
 * @title 需要过滤的文件夹
 * @title Folder list need to filter
 *
 * @description 常见的第三方包路径、框架、git、三方配置文件等
 * **/
exports.filterList = [
    './dist',
    './node_modules',
    './umi',
    './public',
    './mock',
    './document',
    './chart',
    './.vscode',
    './.idea',
    './husky',
    './.git',
    './.tscache',
    './.eslintrc.js',
    './.stylelintrc.js',
    './.umirc',
    './commitlint.config.js',
    './jest.config.js',
    './countComment.js'
]
