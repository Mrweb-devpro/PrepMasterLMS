export type CalloutTone = "tip" | "warning" | "memory";

export interface CppChapter {
  id: string;
  module: string;
  title: string;
  minutes: number;
  intro: string;
  sections: Array<{
    heading: string;
    paragraphs: string[];
    diagram?: string;
    code?: { fileName: string; source: string; output?: string };
    callout?: { tone: CalloutTone; title: string; body: string };
  }>;
}

export const cppChapters: CppChapter[] = [
  {
    id: "cpp-1-1",
    module: "Module 1 · Foundations & Compilation",
    title: "Hello World, g++ & the Build Pipeline",
    minutes: 6,
    intro: "Your first C++ program is small, but it introduces the same build process used for engineering software.",
    sections: [
      {
        heading: "Your first program",
        paragraphs: [
          "A C++ program starts in main(). The compiler turns your source file into a program your computer can run.",
          "Use #include to bring in the tools for input and output. std::cout writes text to the terminal.",
        ],
        code: {
          fileName: "main.cpp",
          source: '#include <iostream>\n\nint main() {\n  std::cout << "Hello, engineer!\\n";\n  return 0;\n}',
          output: "Hello, engineer!",
        },
        callout: { tone: "tip", title: "Compile it", body: "Run g++ main.cpp -o hello, then run ./hello. The -o option gives the finished program a name." },
      },
      {
        heading: "What happens when you build?",
        paragraphs: ["Your source code is checked, translated, and linked with library code before it becomes an executable file."],
        diagram: "main.cpp  →  compiler  →  object code  →  linker  →  program",
      },
    ],
  },
  {
    id: "cpp-1-2",
    module: "Module 1 · Foundations & Compilation",
    title: "Primitive Types, sizeof & Streams",
    minutes: 8,
    intro: "Numbers have different sizes and meanings. Choosing a suitable type prevents surprising calculations later.",
    sections: [
      {
        heading: "Store the right kind of value",
        paragraphs: ["int stores whole numbers. double stores decimal values. char stores one character, and bool stores true or false."],
        code: {
          fileName: "types.cpp",
          source: '#include <iostream>\n\nint main() {\n  int bolts = 12;\n  double diameter = 8.5;\n  std::cout << "int uses " << sizeof(int) << " bytes\\n";\n  std::cout << bolts * diameter << " mm\\n";\n}',
          output: "int uses 4 bytes\n102 mm",
        },
        callout: { tone: "warning", title: "Watch integer division", body: "5 / 2 is 2 when both values are int. Use 5.0 / 2 or a double when you need 2.5." },
      },
      {
        heading: "Read input with std::cin",
        paragraphs: ["std::cin waits for a value typed in the terminal. std::cout displays it back to the user."],
        code: {
          fileName: "input.cpp",
          source: 'double force{};\nstd::cout << "Enter force: ";\nstd::cin >> force;\nstd::cout << "Force = " << force << " N\\n";',
        },
      },
    ],
  },
  {
    id: "cpp-2-1",
    module: "Module 2 · Memory & Pointers",
    title: "Stack vs. Heap Memory",
    minutes: 7,
    intro: "C++ gives you direct access to memory. First, learn where local values live and when memory must outlast a function.",
    sections: [
      {
        heading: "Two useful places for data",
        paragraphs: ["Local variables normally live on the stack and disappear when their function ends. Heap memory stays available until it is released or owned by an object."],
        diagram: "Stack: local variables, automatic cleanup\nHeap: dynamic objects, explicit ownership",
        callout: { tone: "memory", title: "Engineering rule", body: "Prefer ordinary local objects first. Reach for dynamic memory only when you truly need a longer lifetime or dynamic size." },
      },
    ],
  },
  {
    id: "cpp-2-2",
    module: "Module 2 · Memory & Pointers",
    title: "Pointers, Dereferencing & References",
    minutes: 9,
    intro: "A pointer stores an address. A reference gives another name to an existing value. Both help functions work with real data without unnecessary copies.",
    sections: [
      {
        heading: "Look at an address",
        paragraphs: ["The & operator gets an address. The * operator follows a pointer to the value stored at that address."],
        code: {
          fileName: "pointers.cpp",
          source: 'int temperature = 25;\nint* sensor = &temperature;\n\n*sensor = 30;\nstd::cout << temperature << " C\\n";',
          output: "30 C",
        },
        callout: { tone: "warning", title: "Never dereference a null pointer", body: "A pointer with no valid address must not be used with *. Check it, or use safer ownership tools." },
      },
      {
        heading: "Use a reference for clear function calls",
        paragraphs: ["A reference parameter can update the original value without pointer syntax at the call site."],
        code: { fileName: "reference.cpp", source: "void calibrate(double& value) {\n  value += 0.25;\n}" },
      },
    ],
  },
  {
    id: "cpp-2-3",
    module: "Module 2 · Memory & Pointers",
    title: "Dynamic Allocation & Memory Leaks",
    minutes: 8,
    intro: "Dynamic allocation can be useful, but raw new and delete are easy to misuse. Modern C++ gives you safer tools.",
    sections: [
      {
        heading: "The risky old pattern",
        paragraphs: ["Every successful new must have one matching delete. Forgetting delete creates a memory leak: memory that your program can no longer use or release."],
        code: { fileName: "legacy.cpp", source: "double* readings = new double[100];\n// use readings\ndelete[] readings;" },
        callout: { tone: "memory", title: "Prefer containers", body: "std::vector owns its memory and releases it automatically. In modern C++, it is usually the better default." },
      },
    ],
  },
  {
    id: "cpp-3-1",
    module: "Module 3 · Object-Oriented Engineering",
    title: "Classes, Constructors & RAII",
    minutes: 10,
    intro: "Classes group related data and actions. Constructors prepare an object, while destructors clean up automatically when it leaves scope.",
    sections: [
      {
        heading: "Model a sensor",
        paragraphs: ["RAII means a resource belongs to an object. When the object is created, it acquires what it needs; when it is destroyed, cleanup happens automatically."],
        code: {
          fileName: "sensor.cpp",
          source: "class Sensor {\n public:\n  explicit Sensor(double offset) : offset_{offset} {}\n  double read(double raw) const { return raw + offset_; }\n\n private:\n  double offset_;\n};",
        },
        callout: { tone: "tip", title: "Why this matters", body: "RAII prevents cleanup being forgotten when a function returns early or an error happens." },
      },
    ],
  },
  {
    id: "cpp-3-2",
    module: "Module 3 · Object-Oriented Engineering",
    title: "Operator Overloading for Engineering Vectors",
    minutes: 9,
    intro: "Operator overloading lets your own types behave naturally, so vector addition can read like the mathematics it represents.",
    sections: [
      {
        heading: "Make addition meaningful",
        paragraphs: ["Only overload operators when the meaning is clear to another engineer reading the code."],
        code: {
          fileName: "vector2.cpp",
          source: "struct Vector2 {\n  double x;\n  double y;\n\n  Vector2 operator+(const Vector2& other) const {\n    return {x + other.x, y + other.y};\n  }\n};",
        },
      },
    ],
  },
  {
    id: "cpp-4-1",
    module: "Module 4 · Standard Template Library",
    title: "Vectors, Maps & Algorithms",
    minutes: 10,
    intro: "The Standard Template Library gives you tested containers and algorithms, so you can focus on the engineering problem instead of rebuilding basic tools.",
    sections: [
      {
        heading: "Use std::vector and std::sort",
        paragraphs: ["A vector grows as you add items. Algorithms such as std::sort and std::find work with many containers."],
        code: {
          fileName: "stl.cpp",
          source: "#include <algorithm>\n#include <vector>\n\nstd::vector<double> readings{4.2, 1.8, 3.6};\nstd::sort(readings.begin(), readings.end());",
          output: "readings: 1.8, 3.6, 4.2",
        },
        callout: { tone: "tip", title: "Use the library", body: "Before writing a loop from scratch, check whether the STL already describes what you want to do." },
      },
    ],
  },
];
