// replace this:
{cardArray?.length > 0 && <Flashcards cards={cardArray} />}

// with this:
{cardArray
  ? (cardArray.length > 0
      ? <Flashcards cards={cardArray} />
      : <div style={{marginTop:'.75rem',padding:'.75rem',border:'1px dashed #e5e7eb',borderRadius:'10px'}}>
          No flashcards were generated. Try again or add more details to your note.
        </div>
    )
  : null}
