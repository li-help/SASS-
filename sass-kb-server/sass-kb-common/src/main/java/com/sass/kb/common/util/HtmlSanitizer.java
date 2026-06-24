package com.sass.kb.common.util;

import org.owasp.html.HtmlPolicyBuilder;
import org.owasp.html.PolicyFactory;

public final class HtmlSanitizer {

    private static final PolicyFactory POLICY = new HtmlPolicyBuilder()
            .allowStandardUrlProtocols()
            .allowElements(
                    "h1", "h2", "h3", "h4", "h5", "h6",
                    "p", "br", "hr",
                    "ul", "ol", "li",
                    "blockquote", "pre", "code",
                    "strong", "em", "s", "u", "mark",
                    "a", "img",
                    "table", "thead", "tbody", "tr", "th", "td",
                    "div", "span"
            )
            .allowAttributes("href", "target").onElements("a")
            .allowAttributes("src", "alt", "title", "width", "height").onElements("img")
            .allowAttributes("class").globally()
            .allowAttributes("data-type", "data-checked").onElements("li")
            .allowAttributes("colspan", "rowspan").onElements("td", "th")
            .toFactory();

    private HtmlSanitizer() {}

    public static String sanitize(String html) {
        if (html == null || html.isBlank()) {
            return html;
        }
        return POLICY.sanitize(html);
    }
}
