/**
 * @author Neo(001@usd.dog)
 * @date 2022-11-25
 * 统计指定目录下代码行数及注释率
 *
 * 用法: node ./index.js <需要统计的项目目录，默认为当前项目'./'> [需要统计的文件后缀名，数组，默认为：['.js', '.ts', '.tsx']]...
 * 后缀名不填的话默认为统计 .js 和 .ts 文件
 * 统计当前目录下的所有js文件的注释率
 * node commentCount.js ./ .js
 *
 * 示例 [统计 ./src 下的 js 文件]: node count.js ./src
 * 示例 [统计 ./dist 下的 java 文件]: node count.js ./src .java
 */

const fs = require('fs');
const path = require('path');
const defaultConfig = require('./config');
const i18n = require('./i18n');
const typest = require('typest');
const Spinner = require('cli-spinner').Spinner;
const defaultFilterList = [
    './node_modules',
    './.vscode',
    './.idea',
    './husky',
    './.git',
    './.tscache',
    './.eslintrc.js',
    './.stylelintrc.js',
    './jest.config.js',
]
/**
 * 更新总计信息
 *
 * @param {string} projectPath 需要统计的项目的路径
 * @param {object} config 配置文件，可以在根目录中找到配置文件案例
 */
exports.run = async  (projectPath, config) => {
    const startTimeStamp = new Date().getTime();
    const spinner = new Spinner('正在分析目录结构.. %s');
    if (config && config.filterList && typest.isArray(config.filterList)) {
        config.filterList = Array.from(new Set([...defaultFilterList, config.filterList]));
    }
    const mergeConfig = Object.assign({}, defaultConfig, config);
    if (typest.isEmpty(mergeConfig.countType)) {
        throw new Error ('config.countType Can not be empty.')
    }
    if (typest.isEmpty(mergeConfig.filterList)) {
        console.warn('%c [WARNING]: [ config.filterList ] is empty, this may cause performance problem , and make this tool slow down.', 'color: green;')
    }
    // 获取命令行参数
    const parm = process.argv.splice(2);
    // 第一个参数是路径
    const rootPath = parm[0];
    // 后面的所有参数都是文件后缀
    let types = parm.splice(1);
    if (types.length === 0) types = mergeConfig.countType;
    // 需要过滤的文件夹
    const filter = mergeConfig.filterList;
    // 总计
    const total = {
        [i18n[mergeConfig.LANG].path]: 'total',
        [i18n[mergeConfig.LANG].length]: 0,
        [i18n[mergeConfig.LANG].comment]: 0,
        [i18n[mergeConfig.LANG].commentRatio]: 1,
    };
    // 统计结果
    const result = [];

    /**
     * 对指定文件进行统计
     * 包括获取文件行数、注释及计算注释率
     *
     * @param {string} path 文件路径
     */
    async function count(path) {
        const rep = await fs.readFileSync(path).toString();
        const lines = rep.split('\n');
        // 匹配出注释的行数
        const commentNum = lines.filter(line =>
            new RegExp('^(//|/\\*|\\*|\\*/)', 'g').test(line.trimStart()),
        ).length;

        result.push({
            [i18n[mergeConfig.LANG].path]: path.replace(/\/\//g, '/'),
            [i18n[mergeConfig.LANG].length]: lines.length,
            [i18n[mergeConfig.LANG].comment]: commentNum,
            [i18n[mergeConfig.LANG].commentRatio]: Math.round((commentNum / lines.length) * 10000) / 100 + '%',
        });

        updateTotal(lines.length, commentNum);
    }

    /**
     * 更新总计信息
     *
     * @param {number} length 新增行数
     * @param {number} comment 新增注释
     */
    function updateTotal(length, comment) {
        total[i18n[mergeConfig.LANG].length] += length;
        total[i18n[mergeConfig.LANG].comment] += comment;
        total[i18n[mergeConfig.LANG].commentRatio] =
            Math.round((total[i18n[mergeConfig.LANG].comment] / total[i18n[mergeConfig.LANG].length]) * 10000) / 100 + '%';
    }

    /**
     * 递归所有文件夹统计
     *
     * @param {string} pt 根目录
     */
    async function start(pt) {
        const folderList = fs.readdirSync(pt);
        folderList
            .map(file => `${pt}/${file}`)
            .forEach(file => {
                pt = pt.replace(/\/\//g, '/')
                const stat = fs.statSync(file);
                file = file.replace(/\/\//g, '/')
                // 是文件夹就递归
                if (stat.isDirectory()) {
                    // 防止死循环
                    if (filter.indexOf(pt) !== -1) return;
                    return start(file);
                }
                const isInFilter = filter.filter(item => {
                    const isExist = fs.existsSync(item);
                    if (isExist) {
                        const filterItemState = fs.statSync(item);
                        // 文件夹排除
                        if (filterItemState.isDirectory()) {
                            item += '/'
                            return RegExp(item).test(file)
                        }
                    }
                    return false
                }).length
                // 是文件并且后缀名符合就执行统计
                if (types.indexOf(path.extname(file)) !== -1 && !isInFilter) count(file);
            });
    }

    spinner.setSpinnerString('|/-\\');
    spinner.start();
    await start(projectPath || rootPath || './')
    spinner.stop();
    console.log('\n 项目分析结束');
    console.log('\n');
    const endTimeStamp = new Date().getTime();
    total[i18n[mergeConfig.LANG].time] = `${((endTimeStamp - startTimeStamp)/1000).toFixed(2)}s`
    result.push(total);
    console.table(result);
    return result
}
// demo run
(async () => {
    // 获取命令行参数
    const parm = process.argv.splice(2);
    // 第一个参数是路径
    const rootPath = parm[0];
    // 后面的所有参数都是文件后缀
    let types = parm.splice(1);
    if (typest.isEmpty(types)) {
        throw new Error ('config.countType Can not be empty.')
    } else {
        defaultConfig.countType = types;
    }
    if (typest.isEmpty(defaultConfig.filterList)) {
        console.warn('%c [WARNING]: [ config.filterList ] is empty, this may cause performance problem , and make this tool slow down.', 'color: green;\n')
        console.warn('%c [WARNING]: You can find config example on current dir: ./config.js , and make this tool slow down.', 'color: green;')
    }
    await this.run(rootPath, {
        countType: types
    })
})();

