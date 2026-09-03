const questionInput =
  document.getElementById("question");

const askButton =
  document.getElementById("askButton");

const answerResult =
  document.getElementById("answerResult");

askButton.addEventListener(
  "click",
  askQuestion
);

async function askQuestion() {
  const question =
    questionInput.value.trim();

  if (!question) {
    alert("Please enter a question");
    return;
  }

  // Show loading state
  answerResult.classList.remove("hidden");

  answerResult.innerHTML = `
    <p>🔍 Searching relevant documents...</p>
    <p>🤖 Generating answer...</p>
  `;

  askButton.disabled = true;

  try {
    const response =
      await fetch("/api/rag/ask", {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          question,
        }),
      });

    const data =
      await response.json();

    if (!data.success) {
      throw new Error(
        data.message ||
          "Failed to get an answer"
      );
    }

    // Create sources HTML
    const sourcesHTML =
      (Array.isArray(data.sources) ? data.sources : [])
        .map((source, index) => {
          const document =
            typeof source === "string"
              ? source
              : source.document || "";

          return `
            <div class="source">
              <strong>
                Source ${index + 1}
              </strong>

              <p>
                ${document}
              </p>
            </div>
          `;
        })
        .join("");

    // Display result
    answerResult.innerHTML = `
      <h2>🤖 Answer</h2>

      <p>
        ${data.answer}
      </p>

      <hr />

      <h3>
        📚 Retrieved Context
      </h3>

      ${sourcesHTML}
    `;

  } catch (error) {
    answerResult.innerHTML = `
      <p>
        ❌ ${error.message}
      </p>
    `;

  } finally {
    askButton.disabled = false;
  }
}