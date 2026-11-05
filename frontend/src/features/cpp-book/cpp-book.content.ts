export type CalloutTone = "tip" | "warning" | "memory";

export interface CppChapter {
  id: string;
  module: string;
  navTitle: string;
  title: string;
  intro: string;
  sections: Array<{
    heading: string;
    paragraphs: string[];
    diagram?: string;
    code?: { fileName: string; source: string; output?: string };
    callout?: { tone: CalloutTone; title: string; body: string };
  }>;
}

const lesson = (
  id: string,
  module: string,
  navTitle: string,
  title: string,
  intro: string,
  heading: string,
  paragraphs: string[],
  code?: { fileName: string; source: string; output?: string },
  callout?: { tone: CalloutTone; title: string; body: string },
): CppChapter => ({ id, module, navTitle, title, intro, sections: [{ heading, paragraphs, ...(code ? { code } : {}), ...(callout ? { callout } : {}) }] });

export const cppChapters: CppChapter[] = [
  {
    id: "cpp-intro",
    module: "Getting Started",
    navTitle: "Intro",
    title: "What is C++?",
    intro: "C++ is a programming language used to build fast programs, from engineering tools and simulations to embedded systems.",
    sections: [{
      heading: "C++ in simple terms",
      paragraphs: [
        "C++ lets you write instructions for a computer. It is popular when software needs speed, careful memory use, or direct contact with hardware.",
        "C++ is a high-level language because people can write readable words and symbols. The compiler translates that code into low-level machine instructions the computer can run.",
      ],
      diagram: "C++ code  →  compiler  →  machine instructions  →  computer",
      callout: { tone: "tip", title: "No experience needed", body: "Start with the small examples. Each lesson builds on the last one." },
    }],
  },
  {
    id: "cpp-get-started",
    module: "Getting Started",
    navTitle: "Get Started",
    title: "Install C++ and Set Up Your Tools",
    intro: "You need two things before writing C++: an editor for writing code and a compiler for building it.",
    sections: [
      {
        heading: "Choose your tools",
        paragraphs: [
          "Use Visual Studio Code as your editor. Then install a C++ compiler approved by your lecturer or school. On Windows, common choices are MSYS2/MinGW-w64 or Visual Studio Build Tools.",
          "Open a terminal after installation and run g++ --version. A version number means the compiler is ready.",
        ],
        code: { fileName: "terminal", source: "g++ --version" },
        callout: { tone: "memory", title: "Two different jobs", body: "VS Code helps you write code. g++ checks and turns that code into a program." },
      },
      {
        heading: "Create your first folder",
        paragraphs: ["Create a folder named cpp-learning. Inside it, create a file named main.cpp. This is where your first C++ program will live."],
        diagram: "cpp-learning/\n└── main.cpp",
      },
    ],
  },
  lesson(
    "cpp-syntax", "Basics", "Syntax", "C++ Syntax",
    "Every C++ program follows a small set of rules. Learn the pieces you will see in nearly every program.",
    "A complete program",
    ["#include gives your program useful library tools. main() is where a program begins. Curly brackets hold the instructions to run."],
    { fileName: "main.cpp", source: '#include <iostream>\n\nint main() {\n  std::cout << "Hello World!\\n";\n  return 0;\n}', output: "Hello World!" },
    { tone: "warning", title: "C++ is case-sensitive", body: "cout and Cout are different names. End ordinary statements with a semicolon." },
  ),
  lesson(
    "cpp-output", "Basics", "Output", "C++ Output",
    "Use std::cout to display text, numbers, and calculation results in the terminal.",
    "Print a result",
    ["The << symbols send values to std::cout. Use \\n to move to a new line."],
    { fileName: "output.cpp", source: 'double load = 18.5;\nstd::cout << "Load: " << load << " N\\n";', output: "Load: 18.5 N" },
  ),
  lesson(
    "cpp-comments", "Basics", "Comments", "C++ Comments",
    "Comments explain your thinking to another person reading the code. The compiler ignores them.",
    "Write helpful notes",
    ["Use // for a short note on one line. Explain why you made a choice instead of repeating what obvious code already says."],
    { fileName: "comments.cpp", source: "// Convert kilograms to newtons\ndouble force = mass * 9.81;" },
    { tone: "tip", title: "Keep comments current", body: "An old comment can be more confusing than no comment at all." },
  ),
  lesson(
    "cpp-variables", "Variables & Data Types", "Variables", "C++ Variables",
    "A variable is a named place for a value your program needs to remember.",
    "Create a variable",
    ["Write the type first, then a clear name, then its starting value. Choose names that explain the measurement or job of the value."],
    { fileName: "variables.cpp", source: "int boltCount = 12;\ndouble diameter = 8.5;\nchar grade = 'A';" },
  ),
  lesson(
    "cpp-user-input", "Variables & Data Types", "User Input", "C++ User Input",
    "Use std::cin to accept a value typed by the person running your program.",
    "Read a measurement",
    ["std::cin places the entered value inside your variable. Make sure the variable type matches the value you expect."],
    { fileName: "input.cpp", source: 'double mass{};\nstd::cout << "Enter mass in kg: ";\nstd::cin >> mass;\nstd::cout << "Mass: " << mass << " kg\\n";' },
  ),
  lesson(
    "cpp-data-types", "Variables & Data Types", "Data Types", "C++ Data Types",
    "A data type tells C++ what kind of value a variable can hold.",
    "Choose the right type",
    ["Use int for whole numbers, double for decimal measurements, char for one character, bool for true or false, and std::string for text."],
    { fileName: "types.cpp", source: "int students = 42;\ndouble voltage = 12.6;\nbool isSafe = true;" },
    { tone: "warning", title: "Whole-number division", body: "5 / 2 gives 2 because both values are int. Use 5.0 / 2 when you need 2.5." },
  ),
  lesson(
    "cpp-operators", "Variables & Data Types", "Operators", "C++ Operators",
    "Operators let you calculate, compare values, and combine true or false conditions.",
    "Calculate and compare",
    ["Arithmetic operators include +, -, *, /, and %. Comparison operators such as == and < produce true or false."],
    { fileName: "operators.cpp", source: "double area = length * width;\nbool isLarge = area > 10.0;" },
  ),
  lesson(
    "cpp-strings", "Variables & Data Types", "Strings", "C++ Strings",
    "A string stores words and sentences, such as a material name or a student's name.",
    "Work with text",
    ["Include <string> when you use std::string. The + operator can join pieces of text."],
    { fileName: "strings.cpp", source: '#include <string>\n\nstd::string material = "Aluminium";\nstd::cout << "Material: " << material << "\\n";' },
  ),
  lesson(
    "cpp-math", "Variables & Data Types", "Math", "C++ Math",
    "The <cmath> library gives you useful engineering calculations such as square roots and powers.",
    "Use the math library",
    ["Functions in std:: use the <cmath> header. For example, std::sqrt finds a square root."],
    { fileName: "math.cpp", source: "#include <cmath>\n\ndouble hypotenuse = std::sqrt(a * a + b * b);" },
  ),
  lesson(
    "cpp-booleans", "Variables & Data Types", "Booleans", "C++ Booleans",
    "A boolean stores one of two answers: true or false.",
    "Ask a yes-or-no question",
    ["Booleans are useful for checks such as whether a reading is inside a safe range."],
    { fileName: "booleans.cpp", source: "bool withinLimit = temperature <= maxTemperature;" },
  ),
  lesson(
    "cpp-if-else", "Control Flow", "If...Else", "C++ If...Else",
    "An if statement lets a program choose what to do when a condition is true or false.",
    "Make a decision",
    ["The condition inside parentheses must become true or false. The matching block of code then runs."],
    { fileName: "if-else.cpp", source: 'if (pressure > limit) {\n  std::cout << "Warning: pressure is high\\n";\n} else {\n  std::cout << "Pressure is safe\\n";\n}' },
  ),
  lesson(
    "cpp-switch", "Control Flow", "Switch", "C++ Switch",
    "A switch is useful when one value can match several clear options.",
    "Choose from known options",
    ["Use break after each case so C++ does not continue into the next case by accident."],
    { fileName: "switch.cpp", source: 'switch (mode) {\n  case 1: std::cout << "Manual\\n"; break;\n  case 2: std::cout << "Automatic\\n"; break;\n  default: std::cout << "Unknown mode\\n";\n}' },
  ),
  lesson(
    "cpp-while", "Control Flow", "While Loop", "C++ While Loop",
    "A while loop repeats while its condition remains true.",
    "Repeat carefully",
    ["Change something inside the loop so its condition can eventually become false. Otherwise, the loop may never stop."],
    { fileName: "while.cpp", source: "int attempt = 0;\nwhile (attempt < 3) {\n  ++attempt;\n}" },
    { tone: "warning", title: "Avoid endless loops", body: "Always check how the loop condition will become false." },
  ),
  lesson(
    "cpp-for", "Control Flow", "For Loop", "C++ For Loop",
    "A for loop is a compact way to repeat something a known number of times.",
    "Count through values",
    ["The first part starts a counter, the second checks when to stop, and the third updates the counter."],
    { fileName: "for.cpp", source: 'for (int sample = 1; sample <= 5; ++sample) {\n  std::cout << sample << "\\n";\n}' },
  ),
  lesson(
    "cpp-break-continue", "Control Flow", "Break/Continue", "C++ Break and Continue",
    "break ends a loop early. continue skips the remaining work for one loop cycle.",
    "Control a loop",
    ["Use these sparingly. A simple loop condition is often easier to read."],
    { fileName: "break.cpp", source: "if (reading < 0) {\n  continue; // Ignore an invalid reading\n}" },
  ),
  lesson(
    "cpp-arrays", "Functions & Memory", "Arrays", "C++ Arrays",
    "An array keeps several values of the same type together in order.",
    "Store a fixed set",
    ["Array positions begin at zero. For flexible lists, you will later use std::vector."],
    { fileName: "arrays.cpp", source: 'double readings[3] = {4.2, 3.8, 4.0};\nstd::cout << readings[0] << "\\n";' },
  ),
  lesson(
    "cpp-functions", "Functions & Memory", "Functions", "C++ Functions",
    "A function is a named block of code you can run whenever you need the same task done.",
    "Reuse a calculation",
    ["Functions make large programs easier to test and understand. Give a function one focused job."],
    { fileName: "functions.cpp", source: "double area(double length, double width) {\n  return length * width;\n}" },
  ),
  lesson(
    "cpp-references", "Functions & Memory", "References", "C++ References",
    "A reference is another name for an existing variable. It is useful when a function should update the original value.",
    "Pass by reference",
    ["The & in a parameter means the function can work with the caller's original value."],
    { fileName: "references.cpp", source: "void calibrate(double& value) {\n  value += 0.25;\n}" },
  ),
  lesson(
    "cpp-pointers", "Functions & Memory", "Pointers", "C++ Pointers",
    "A pointer stores the address of another value. Pointers are powerful, but require careful handling.",
    "Follow an address",
    ["& gets a variable's address. * follows a pointer to the value stored at that address."],
    { fileName: "pointers.cpp", source: "int temperature = 25;\nint* sensor = &temperature;\n*sensor = 30;" },
    { tone: "memory", title: "Use pointers carefully", body: "Never follow a pointer unless it points to a valid value." },
  ),
];
