/**
 * Sample K-DSL code templates for the playground.
 */

export const SAMPLE_CARD = `// Simple Card Example
KColumn(
  modifier = kModifier(
    fillMaxSize = 1.0f,
    padding = kPadding(all = 16),
    background = "#FFF8FAFC"
  ),
  verticalArrangement = KArrangements.Center,
  horizontalAlignment = KAlignments.CenterHorizontally
) {
  KCard(
    modifier = kModifier(fillMaxWidth = 1.0f),
    shape = KShapes.Rounded16,
    containerColor = "#FF1E293B",
    elevation = 8
  ) {
    KColumn(
      modifier = kModifier(padding = kPadding(all = 24)),
      horizontalAlignment = KAlignments.CenterHorizontally
    ) {
      KImage(
        source = kImageUrl("https://api.dicebear.com/9.x/shapes/svg?seed=Sophie"),
        modifier = kModifier(width = 80, height = 80),
        contentDescription = "Avatar",
        scaleType = KScaleType.CenterCrop
      )

      KSpacer(height = 12)

      KText(
        text = "Hello, Developer!",
        fontSize = 22,
        fontWeight = KFontWeights.Bold,
        color = "#FFFFFFFF"
      )

      KSpacer(height = 4)

      KText(
        text = "Welcome to Ketoy Playground",
        fontSize = 14,
        color = "#FF94A3B8"
      )
    }
  }

  KSpacer(height = 16)

  KRow(
    modifier = kModifier(fillMaxWidth = 1.0f),
    horizontalArrangement = KArrangements.SpaceEvenly
  ) {
    KButton(containerColor = "#FF3B82F6") {
      KText(text = "Get Started", color = "#FFFFFFFF", fontSize = 14)
    }
    KButton(containerColor = "#FF10B981") {
      KText(text = "Learn More", color = "#FFFFFFFF", fontSize = 14)
    }
  }

  KSpacer(height = 16)

  KBox(
    modifier = kModifier(
      fillMaxWidth = 1.0f,
      padding = kPadding(all = 16),
      background = "#FFE0F2FE"
    ),
    contentAlignment = KAlignments.Center
  ) {
    KText(
      text = "Build beautiful UIs with K-DSL",
      fontSize = 16,
      fontWeight = KFontWeights.Medium,
      color = "#FF1E40AF",
      textAlign = KTextAlign.Center
    )
  }
}`;

export const SAMPLE_LIST = `// List Layout Example
KColumn(
  modifier = kModifier(
    fillMaxSize = 1.0f,
    padding = kPadding(all = 12),
    background = "#FFF1F5F9"
  )
) {
  KText(
    text = "My Tasks",
    fontSize = 24,
    fontWeight = KFontWeights.Bold,
    color = "#FF0F172A"
  )

  KSpacer(height = 16)

  // Task 1
  KCard(
    modifier = kModifier(fillMaxWidth = 1.0f),
    shape = KShapes.Rounded12,
    containerColor = "#FFFFFFFF",
    elevation = 2
  ) {
    KRow(
      modifier = kModifier(
        padding = kPadding(all = 16),
        fillMaxWidth = 1.0f
      ),
      verticalAlignment = KAlignments.CenterVertically
    ) {
      KBox(
        modifier = kModifier(
          width = 40,
          height = 40,
          background = "#FFDBEAFE"
        ),
        contentAlignment = KAlignments.Center
      ) {
        KImage(
          source = kImageUrl("https://api.dicebear.com/9.x/icons/svg?seed=check"),
          modifier = kModifier(width = 24, height = 24),
          contentDescription = "Done"
        )
      }
      KColumn(
        modifier = kModifier(padding = kPadding(horizontal = 12))
      ) {
        KText(
          text = "Design new landing page",
          fontSize = 16,
          fontWeight = KFontWeights.SemiBold,
          color = "#FF1E293B"
        )
        KText(
          text = "Due: Tomorrow",
          fontSize = 12,
          color = "#FF94A3B8"
        )
      }
    }
  }

  KSpacer(height = 8)

  // Task 2
  KCard(
    modifier = kModifier(fillMaxWidth = 1.0f),
    shape = KShapes.Rounded12,
    containerColor = "#FFFFFFFF",
    elevation = 2
  ) {
    KRow(
      modifier = kModifier(
        padding = kPadding(all = 16),
        fillMaxWidth = 1.0f
      ),
      verticalAlignment = KAlignments.CenterVertically
    ) {
      KBox(
        modifier = kModifier(
          width = 40,
          height = 40,
          background = "#FFFEF3C7"
        ),
        contentAlignment = KAlignments.Center
      ) {
        KImage(
          source = kImageUrl("https://api.dicebear.com/9.x/icons/svg?seed=clock"),
          modifier = kModifier(width = 24, height = 24),
          contentDescription = "In Progress"
        )
      }
      KColumn(
        modifier = kModifier(padding = kPadding(horizontal = 12))
      ) {
        KText(
          text = "Write API documentation",
          fontSize = 16,
          fontWeight = KFontWeights.SemiBold,
          color = "#FF1E293B"
        )
        KText(
          text = "Due: Friday",
          fontSize = 12,
          color = "#FF94A3B8"
        )
      }
    }
  }

  KSpacer(height = 8)

  // Task 3
  KCard(
    modifier = kModifier(fillMaxWidth = 1.0f),
    shape = KShapes.Rounded12,
    containerColor = "#FFFFFFFF",
    elevation = 2
  ) {
    KRow(
      modifier = kModifier(
        padding = kPadding(all = 16),
        fillMaxWidth = 1.0f
      ),
      verticalAlignment = KAlignments.CenterVertically
    ) {
      KBox(
        modifier = kModifier(
          width = 40,
          height = 40,
          background = "#FFFFE4E6"
        ),
        contentAlignment = KAlignments.Center
      ) {
        KImage(
          source = kImageUrl("https://api.dicebear.com/9.x/icons/svg?seed=fire"),
          modifier = kModifier(width = 24, height = 24),
          contentDescription = "Urgent"
        )
      }
      KColumn(
        modifier = kModifier(padding = kPadding(horizontal = 12))
      ) {
        KText(
          text = "Fix production bug",
          fontSize = 16,
          fontWeight = KFontWeights.SemiBold,
          color = "#FF1E293B"
        )
        KText(
          text = "Due: Today",
          fontSize = 12,
          color = "#FFEF4444"
        )
      }
    }
  }

  KSpacer(height = 20)

  KButton(containerColor = "#FF3B82F6") {
    KText(text = "+ Add New Task", color = "#FFFFFFFF", fontSize = 14)
  }
}`;

export const SAMPLES = [
  { label: 'Card', code: SAMPLE_CARD },
  { label: 'List', code: SAMPLE_LIST },
];
