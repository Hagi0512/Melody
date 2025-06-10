package com.it.melody.pojo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.awt.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Songs {
    private int songId;
    private String title;
    private String filePath;
    private int duration;
    private String artist;
    private String album;
    private byte[] coverImage;
    private String cover;
    private LocalDateTime uploadedAt;
}
