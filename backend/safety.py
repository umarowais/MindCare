
import re


# 1. Explicit statements suggesting immediate danger
IMMEDIATE_PATTERNS = [
    r"\bi am going to hurt myself\b",
    r"\bi'm going to hurt myself\b",
    r"\bi am about to hurt myself\b",
    r"\bi am going to kill myself\b",
    r"\bi'm going to kill myself\b",
    r"\bi am about to kill myself\b",
    r"\bi will kill myself\b",
    r"\bi have taken an overdose\b",
    r"\bi just took an overdose\b",
    r"\bi have already hurt myself\b",
    r"\bi have a plan to kill myself\b",
    r"\bi have a plan to end my life\b",
]

# 2. Statements suggesting suicidal thoughts or self-harm
HIGH_RISK_PATTERNS = [
    r"\bi want to kill myself\b",
    r"\bi want to end my life\b",
    r"\bi want to die\b",
    r"\bi don't want to live\b",
    r"\bi do not want to live\b",
    r"\bi wish i was dead\b",
    r"\bi am thinking about suicide\b",
    r"\bi'm thinking about suicide\b",
    r"\bi am thinking of suicide\b",
    r"\bi want to hurt myself\b",
    r"\bi feel like hurting myself\b",
    r"\bi might hurt myself\b",
    r"\bi might kill myself\b",
    r"\bi feel like ending my life\b",
    r"\bi cannot keep myself safe\b",
    r"\bi can't keep myself safe\b",
    r"\bi have no reason to live\b",
    r"\bi don't feel safe with myself\b",
    r"\bi feel like everyone would be better without me\b",
    r"\beveryone would be better off without me\b",
    r"\bi cannot go on anymore\b",
    r"\bi can't go on anymore\b",
    r"\bi cannot keep going\b",
    r"\bi feel like disappearing forever\b",
    r"\bi wish i could disappear forever\b",
    r"\bi am better off dead\b",
]

# 3. Statements about another person's safety
THIRD_PARTY_PATTERNS = [
    r"\bmy friend\b",
    r"\bmy sister\b",
    r"\bmy brother\b",
    r"\bmy mother\b",
    r"\bmy father\b",
    r"\bmy partner\b",
    r"\bsomeone i know\b",
    r"\bmy family member\b",
    r"\bmy classmate\b",
]

THIRD_PARTY_RISK_PATTERNS = [
    r"\bwants to kill (?:himself|herself|themselves)\b",
    r"\bwants to end (?:his|her|their) life\b",
    r"\bis thinking about suicide\b",
    r"\bis thinking of suicide\b",
    r"\bsaid (?:he|she|they) wants to die\b",
    r"\btried to hurt (?:himself|herself|themselves)\b",
    r"\bhas taken an overdose\b",
    r"\bmight hurt (?:himself|herself|themselves)\b",
]

# 4. Clear negated statements
NEGATION_PATTERNS = [
    r"\bi don't want to hurt myself\b",
    r"\bi do not want to hurt myself\b",
    r"\bi don't want to kill myself\b",
    r"\bi do not want to kill myself\b",
    r"\bi am not going to hurt myself\b",
    r"\bi'm not going to hurt myself\b",
    r"\bi am not going to kill myself\b",
    r"\bi'm not going to kill myself\b",
    r"\bi won't hurt myself\b",
    r"\bi will not hurt myself\b",
    r"\bi won't kill myself\b",
    r"\bi will not kill myself\b",
    r"\bi have no intention of hurting myself\b",
]


def matches_any(patterns, text):
    for pattern in patterns:
        if re.search(pattern, text):
            return pattern
    return None


def detect_safety_risk(message):
    """
    Basic rule-based safety screening.

    Risk levels:
    immediate, high, third_party, low

    This function cannot reliably determine whether a person
    is safe or in danger. It is not a clinical assessment.
    """

    text = message.lower().strip()

    # Empty message
    if not text:
        return {
            "risk_level": "low",
            "detected": False
        }

    # Check explicit first-person immediate danger first
    match = matches_any(IMMEDIATE_PATTERNS, text)

    if match:
        return {
            "risk_level": "immediate",
            "detected": True,
            "matched_pattern": match
        }

    # Check whether the message concerns another person
    third_party_context = matches_any(THIRD_PARTY_PATTERNS, text)
    third_party_risk = matches_any(THIRD_PARTY_RISK_PATTERNS, text)

    if third_party_context and third_party_risk:
        return {
            "risk_level": "third_party",
            "detected": True,
            "matched_pattern": third_party_risk
        }

    # Check explicit negation
    negation = matches_any(NEGATION_PATTERNS, text)

    if negation:
        return {
        "risk_level": "negated",
        "detected": False,
        "matched_pattern": negation
    }

    # Check other high-risk expressions
    match = matches_any(HIGH_RISK_PATTERNS, text)

    if match:
        return {
            "risk_level": "high",
            "detected": True,
            "matched_pattern": match
        }

    # No listed pattern matched
    return {
        "risk_level": "low",
        "detected": False
    }


if __name__ == "__main__":
    test_messages = [
        "I am feeling happy today",
        "I don't want to hurt myself",
        "I am going to hurt myself",
        "I want to end my life",
        "I feel like everyone would be better without me",
        "My friend wants to end his life",
        "My sister is thinking about suicide",
        "I am writing a story about someone who wants to die",
    ]

    for message in test_messages:
        print("\nMessage:", message)
        print("Result:", detect_safety_risk(message))
