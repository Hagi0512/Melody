package com.it.melody.pojo;

import lombok.Data;

import java.util.List;

@Data
public class PageResult<T> {
    private Long total;
    private List<T> rows;

    public PageResult(long total, List<T> result) {
        this.total = total;
        this.rows = result;
    }
}
