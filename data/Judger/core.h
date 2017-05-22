#ifndef CORE_H
#define CORE_H

#include <string>

namespace JUDGE_CONF
{
int JUDGE_TIME_LIMIT   = 15000;  //judge本身的时间限制（ms）

int COMPILE_TIME_LIMIT = 10000;  //编译时间限制（ms）

int SPJ_TIME_LIMIT     = 10000; //SpecialJudge的时间限制(MS)

int STACK_SIZE_LIMIT   = 8192;  //程序运行的栈空间大小

int TIME_LIMIT_ADDTION = 0;  //运行时间附加值

int JAVA_TIME_FACTOR   = 2;  //JAVA语言的运行时间放宽倍数

int JAVA_MEM_FACTOR    = 2;  //JAVA语言的运行内存放宽倍数

//------------------以下是常量----------------------

//OJ结果代码
const int PROCEED = 0;  //已经处理并且正确运行退出
const int CE      = 1;  //编译错误
const int TLE     = 2;  //超时
const int MLE     = 3;  //超内存限制
const int OLE     = 4;  //输出文件超过大小限制
const int RE      = 5;  //运行时错误，包括数组越界、非法调用等
const int WA      = 6;  //答案错误
const int AC      = 7;  //答案正确
const int PE      = 8;  //输出格式错误
const int SE      = 9;  //System Error，判题过程发生故障

//一些常量
const int KILO = 1024;
const int MEGA = KILO * KILO;
const int GIGA = KILO * MEGA;

const int GCC_COMPILE_ERROR = 1; //编译错误

//退出原因
const int EXIT_OK               = 0;  //正常退出
const int EXIT_UNPRIVILEGED     = 1;  //缺乏权限退出
const int EXIT_BAD_PARAM        = 3;  //参数错误退出
const int EXIT_VERY_FIRST       = 4;  //judge程序运行超时退出
const int EXIT_COMPILE          = 6;  //编译错误退出
const int EXIT_PRE_JUDGE        = 9;  //预处理错误退出，如文件无法打开，无法fork进程等
const int EXIT_PRE_JUDGE_PTRACE = 10;  //ptrace运行错误退出
const int EXIT_PRE_JUDGE_EXECLP = 11;  //execlp运行错误退出
const int EXIT_SET_LIMIT        = 15;  //设置时间限制错误退出
const int EXIT_SET_SECURITY     = 17;  //设置安全限制错误退出
const int EXIT_JUDGE            = 21;  //程序调用错误退出
const int EXIT_COMPARE          = 27;
const int EXIT_COMPARE_SPJ      = 30;
const int EXIT_COMPARE_SPJ_FORK = 31;
const int EXIT_TIMEOUT          = 36;  //超时退出
const int EXIT_UNKNOWN          = 127;  //不详

//语言相关常量
const std::string languages[] = {"Unknown", "C", "C++", "Java"};
const int LANG_UNKNOWN = 0;
const int LANG_C       = 1;
const int LANG_CPP     = 2;
const int LANG_JAVA    = 3;

}

namespace PROBLEM
{
int id           = 0; //貌似没用上
int lang         = 0; //待评测的程序语言
int spj_lang     = 0; //SpecialJudge程序的语言
int time_limit   = 1000;   //MS
int memory_limit = 65535;  //KB
int output_limit = 1024 * 8; //KB，输出文件的大小限制
int result       = JUDGE_CONF::SE; //结果代号
int memory_usage = 0;   //内存使用量
int time_usage    = 0;  //时间使用量
std::string extra_message;  //额外信息
std::string status;     //最终结果

bool spj = false;   //是否是SpecialJudge


std::string code_path;  //待评测的代码路径
std::string exec_file;  //编译后生成的可执行程序路径
std::string input_file;  //标准输入文件
std::string output_file;  //标准输出文件
std::string exec_output;  //待评测代码的输出文件
std::string spj_exec_file;  //SpecialJudge的可执行程序
std::string spj_output_file;  //SpecialJudge的输出文件
std::string result_file;  //最终评判结果文件
std::string run_dir;    //沙盒的路径，即所有运行过程所在的文件夹

std::string stdout_file_compiler;  //编译的输出
std::string stderr_file_compiler;  //编译错误信息
}

#endif
